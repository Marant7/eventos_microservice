import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from './s3.js'

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'ecoactivateapp-images',
    //acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `eventos/${Date.now()}_${file.originalname}`);
    }
  })
});

app.post('/eventos/:eventoId/imagen', upload.single('imagen'), async (req, res) => {
  const { eventoId } = req.params;
  const imagenUrl = req.file.location;
  try {
    await pool.query(
      'UPDATE eventos SET imagen_url = ? WHERE id = ?',
      [imagenUrl, eventoId]
    );
    res.json({ imagen_url: imagenUrl });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar la URL de la imagen' });
  }
});
// Subir imagen de participante y guardar URL
app.post('/participantes/:participanteId/imagen', upload.single('imagen'), async (req, res) => {
  const { participanteId } = req.params;
  const imagenUrl = req.file.location;
  try {
    await pool.query(
      'UPDATE participantes SET imagen_url = ? WHERE id = ?',
      [imagenUrl, participanteId]
    );
    res.json({ imagen_url: imagenUrl });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar la URL de la imagen del participante' });
  }
});
// Subir foto de registro de material y guardar URL
app.post('/registros/:registroId/foto', upload.single('foto'), async (req, res) => {
  const { registroId } = req.params;
  const fotoUrl = req.file.location;
  try {
    await pool.query(
      'UPDATE registros_material SET foto_url = ? WHERE id = ?',
      [fotoUrl, registroId]
    );
    res.json({ foto_url: fotoUrl });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar la URL de la foto del registro' });
  }
});

// Obtener todos los eventos
app.get('/eventos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM eventos');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// Crear un evento
app.post('/eventos', async (req, res) => {
  const { nombre, descripcion, fecha_inicio, fecha_fin, lugar, materiales_aceptados, premios, organizador } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO eventos (nombre, descripcion, fecha_inicio, fecha_fin, lugar, materiales_aceptados, premios, organizador) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, descripcion, fecha_inicio, fecha_fin, lugar, materiales_aceptados, premios, organizador]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear evento' });
  }
});
// Inscribir participante a un evento
app.post('/eventos/:eventoId/participantes', async (req, res) => {
  const { nombre, tipo } = req.body;
  const { eventoId } = req.params;
  try {
    const [result] = await pool.query(
      'INSERT INTO participantes (nombre, tipo, evento_id) VALUES (?, ?, ?)',
      [nombre, tipo, eventoId]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error al inscribir participante' });
  }
});

// Listar participantes de un evento
app.get('/eventos/:eventoId/participantes', async (req, res) => {
  const { eventoId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM participantes WHERE evento_id = ?',
      [eventoId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener participantes' });
  }
});

// Registrar material recolectado
app.post('/eventos/:eventoId/registros', async (req, res) => {
  const { participante_id, material, cantidad } = req.body;
  const { eventoId } = req.params;
  try {
    const [result] = await pool.query(
      'INSERT INTO registros_material (participante_id, evento_id, material, cantidad) VALUES (?, ?, ?, ?)',
      [participante_id, eventoId, material, cantidad]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar material' });
  }
});

// Listar registros de materiales por evento
app.get('/eventos/:eventoId/registros', async (req, res) => {
  const { eventoId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT r.id, p.nombre AS participante, r.material, r.cantidad, r.fecha_registro, r.foto_url
       FROM registros_material r
       JOIN participantes p ON r.participante_id = p.id
       WHERE r.evento_id = ?`,
      [eventoId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener registros de materiales' });
  }
});

app.listen(3000, () => {
  console.log('Microservicio de eventos corriendo en puerto 3000');
});