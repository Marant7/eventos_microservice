import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  region: 'us-east-2'
});

export default s3;