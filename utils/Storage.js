const AWS = require("aws-sdk");
const config = require("config");

const s3 = new AWS.S3({
  accessKeyId: config.get("aws.accessKeyId"),
  secretAccessKey: config.get("aws.secretKey"),
});

const Storage = {};

Storage.upload = async (fileInBanary, fileName) => {
  
    const params = {
      Bucket: config.get("aws.bucket"),
      Key: fileName, // File name you want to save as in S3
      Body: fileInBanary,
    };
    const upload = await s3.upload(params).promise();
    // console.log("Upload Data:", upload);
    return upload.Location;
}

module.exports = Storage;
