const firebase = require("firebase-admin");
const config = require("config");
const axios = require("axios");

class NotificationService {
  /**
   * @param {String} title
   * @param {String} body
   * @param {String} FCMToken
   * @param {Object} data
   */
  textNotify = (title, body, FCMToken, data = {}) => {
    return new Promise((resolve, reject) => {

      // if not push token is passed then we resolve to null
      if (!FCMToken) {
        resolve(null)
        return;
      }


      const message = {
        notification: {
          title,
          body: body.length > 60 ? body.substr(0, 60) + "..." : body,
        },
        data,
        android: {
          ttl: 3600 * 1000,
          // notification: {
          //   icon: "no_icon",
          //   color: "#f45342",
          // },
        },
        apns: {
          payload: {
            aps: {
              badge: 42,
            },
          },
        },
        token: FCMToken,
      };
      firebase
        .messaging()
        .send(message)
        .then((resp) => {
          console.log("Message sent successfully:", resp);
          resolve(resp);
        })
        .catch((err) => {
          console.log("Failed to send the message:", err);
          resolve(null)
        });
    })
  };

  /**
   * Send OTP messsage to a receipant
   * @param {String} sms message to be sent
   * @param {String} to phone number of the receipant
   * @param {*} channel whether it's dnd or whatsApp
   */
  sendOTPByTermii = async (sms, to, channel = "dnd") => {
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
        console.log("error", error.response);
        resolve(null)
      }
    })
    
  };
}

module.exports = NotificationService;
