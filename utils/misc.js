const config = require("config");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const sgMail = require("@sendgrid/mail");




exports.GenerateToken = (num) => {
  var text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < num; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};


exports.Mailer = (email, subject, html, senderEmail = config.get("mail.email")) => {
  sgMail.setApiKey(config.get("mail.apiKey"));
  const msg = {
    to: email,
    from: senderEmail,
    subject,
    html,
  };

  return sgMail.send(msg);
};



exports.UploadFile = async (file, churchId) => {
  try {
    const s3 = new AWS.S3();

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
