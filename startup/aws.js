const AWS = require('aws-sdk'); 
const config = require("config");

//configuring the AWS environment
const credentials = new AWS.SharedIniFileCredentials({
  profile: config.get("aws.bucket"),
});
AWS.config.credentials = credentials;
AWS.config.update({
  accessKeyId: AWS.config.credentials.accessKeyId,
  secretAccessKey: AWS.config.credentials.secretAccessKey,
  region: config.get("aws.region"),
});