const config = require("config");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const sgMail = require("@sendgrid/mail");
const RandExp = require("randexp");
const events = require("events");

const GenerateToken = (num) => {
  var text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < num; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

const AsyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

const GenerateOTP = (num) => {
  const OTPCode = new RandExp(`[0-9]{${num}}`).gen();

  return OTPCode;
};

const Mailer = (
  email,
  subject,
  html,
  senderEmail = config.get("mail.email")
) => {
  sgMail.setApiKey(config.get("mail.key"));
  const msg = {
    to: email,
    from: senderEmail,
    subject,
    html,
  };

  return sgMail.send(msg);
};

const UploadFileFormLocal = async (file, churchId) => {
  try {
    console.log("start");

    const params = {
      Bucket: config.get("aws.bucket"),
      Key: `${churchId}/${Date.now()}`,
      // ACL: "public-read"
    };

    const fileContent = fs.readFileSync(__dirname + "/../" + file.path);
    params.Body = fileContent;
    params.ContentEncoding = file.encoding;
    params.ContentType = file.mimetype;
    params.Key = params.Key + "." + file.mimetype.split("/")[1];

    console.log("params", params);

    const upload = await s3.upload(params).promise();
    console.log("Uploaded in:", upload);
    return upload;
  } catch (error) {
    console.log(error);
  }
};

const UploadFileFromBinary = async (fileInBanary, fileName) => {
  const params = {
    Bucket: config.get("aws.bucket"),
    Key: `${Date.now()}_${fileName}`, // File name you want to save as in S3
    Body: fileInBanary,
  };
  const upload = await s3.upload(params).promise();
  // console.log("Upload Data:", upload);
  return upload;
};

const eventEmitter = new events.EventEmitter();

module.exports = {
  GenerateToken,
  GenerateOTP,
  Mailer,
  UploadFileFormLocal,
  UploadFileFromBinary,
  AsyncForEach,
  eventEmitter,
};
