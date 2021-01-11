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


/**
 * Send Mail to an Email
 * @param {string} to
 * @param {string} subject
 * @param {HTML} html
 * @param {string} from
 */
const Mailer = (to, subject, html, from = config.get("mail.email")) => {
  sgMail.setApiKey(config.get("mail.key"));
  return sgMail.send({
    to,
    from,
    subject,
    html,
  });
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

/**
   * Upload a binary file to S3
   * @param {Binary} fileInBanary
   * @param {String} fileName
   */
const UploadFileFromBinary = async (fileInBanary, fileName) => {
  const params = {
    Bucket: config.get("aws.bucket"),
    Key: `${Date.now()}_${fileName}`, // File name you want to save as in S3
    Body: fileInBanary,
  };
  const upload = await s3.upload(params).promise();
  console.log("Upload Data:", upload);
  return upload;
};

/**
   * Upload a binary file to S3
   * @param {Binary} fileInBanary
   * @param {String} fileName
   */
const UploadFileFromBase64 = async (fileInBanary, fileName) => {
  const bur = new Buffer.from(fileInBanary.replace(/^data:image\/\w+;base64,/, ""), "base64");
  const params = {
    Bucket: config.get("aws.bucket"),
    Key: `${Date.now()}_${fileName}.png`, // File name you want to save as in S3
    Body: bur,
    ContentEncoding: "base64",
    ContentType: "image/png",
  };
  const upload = await s3.upload(params).promise();
  console.log("Upload Data:", upload);
  return upload;
};


const paginate = (req) => {
  const page =
    typeof req.query.page !== "undefined" ? Math.abs(req.query.page) : 1;
  const pageSize =
    typeof req.query.pageSize !== "undefined"
      ? Math.abs(req.query.pageSize)
      : 50;
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
};

const isObject = (object) => {
  return typeof object === "object" && object !== null;
}


module.exports = {
  GenerateToken,
  GenerateOTP,
  Mailer,
  UploadFileFormLocal,
  UploadFileFromBinary,
  UploadFileFromBase64,
  AsyncForEach,
  paginate,
  isObject
};
