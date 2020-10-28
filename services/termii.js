const config = require("config");
const axios = require("axios");

sendOTP = async (sms, to, channel = "dnd") => {
  try {
    const request = {
      to,
      from: channel === "whatsapp" ? "Exalt Church" : "OTPAlert",
      sms,
      type: "plain",
      channel: channel === "whatsapp" ? "whatsapp" : "dnd",
      api_key: config.get("termilAPiKey"),
    };
    const otp = await axios.post("https://termii.com/api/sms/send", request);

    console.log("otpotp", otp.data);
  } catch (error) {
    console.log("error", error.response);
  }
};

exports.sendOTP = sendOTP;
