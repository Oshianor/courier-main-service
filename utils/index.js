const config = require("config");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const sgMail = require("@sendgrid/mail");
const RandExp = require("randexp");
const redis = require("redis");
const axios = require("axios");

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

const convertToMonthlyDataArray = (dataArray, dataField) => {
  // 1 <= i <= 12 because there are 12 months in a year
  const monthlyData = [];
  for(let i=1; i <= 12; i++){
    let currentMonthData = dataArray.find((data) => data.month === i);
    if(!currentMonthData){
      monthlyData.push({month: i, [dataField]: 0});
    } else {
      monthlyData.push(currentMonthData);
    }
  }

  return monthlyData.sort().map((data) => data[dataField]);
}


const redisClient = () => {
  const client = redis.createClient(config.get("application.redis"));
  client.on("error", (error) => {
    console.log('Redis Client Error: ', error);
  });

  return client;
}


/**
 * Send OTP messsage to a receipant
 * @param {String} sms message to be sent
 * @param {String} to phone number of the receipant
 * @param {*} channel whether it's dnd or whatsApp
 */
const sendOTPByTermii = async (sms, to, channel = "dnd") => {
  return new Promise(async(resolve, reject) => {
    try {
      const request = {
        to,
        from: channel === "whatsapp" ? "Exalt Church" : "N-Alert",
        sms,
        type: "plain",
        channel: channel === "whatsapp" ? "whatsapp" : "dnd",
        api_key: config.get("termii.key"),
      };
      const otp = await axios.post("https://termii.com/api/sms/send", request);

      console.log("otpotp", otp.data);
      resolve(otp.data);
    } catch (error) {
      console.log("error", to, error);
      resolve(null)
    }
  })
};

const convertToDailyDataArray = (dataArray, dataField) => {
  // 1 <= i <= 7 because there are 7 days in a year
  const dailyData = [];
  for(let i=1; i <= 7; i++){
    let currentDayData = dataArray.find((data) => data.day === i);
    if(!currentDayData){
      dailyData.push({day: i, [dataField]: 0});
    } else {
      dailyData.push(currentDayData);
    }
  }
  console.log(dailyData)

  return dailyData.sort().map((data) => data[dataField]);
}

const calculateInstantPrice = (cost, instantPricing) => {
  const instantPriceFactor = parseFloat(instantPricing);
  const subAmount = parseFloat(cost) * instantPriceFactor;
  const amount = Math.ceil(subAmount/100)*100;

  return amount;
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
  isObject,
  convertToMonthlyDataArray,
  redisClient,
  sendOTPByTermii,
  convertToDailyDataArray,
  calculateInstantPrice
};
