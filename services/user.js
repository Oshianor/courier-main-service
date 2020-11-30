const config = require("config");
const axios = require("axios");
const User = require("../models/users");
const Order = require("../models/order");
const moment = require("moment");
const { MSG_TYPES } = require("../constant/types");
const NotificationService = require("./notification");
const { GenerateOTP, Mailer } = require("../utils")
const { OTPCode } = require("../templates")

/**
 * User service class
 */
class UserService {
  /**
   * Get a user by it's token
   * @param {String} token
   */
  get(token) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(`${config.get("api.base")}/user`, {
          headers: {
            "x-auth-token": token,
          },
        });
        resolve(response.data);
      } catch (error) {
        reject(error.response.data);
      }
    });
  }

  /**
   * Get all users by admin
   * @param {Object} filter
   */
  getAllUsers(filter) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(`${config.get("api.base")}/user/all`, {
          filter,
          headers: {
            "api-key": config.get("api.key"),
          },
        });
        resolve(response.data);
      } catch (error) {
        reject(error.response.data);
      }
    });
  }

  /**
   * Get a single user by it's ID
   * @param {ObjectId} filter
   */
  getByID(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(
          `${config.get("api.base")}/user/${id}`,
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );
        resolve(response.data);
      } catch (error) {
        reject(error.response.data);
      }
    });
  }

  /**
   * Get a single card for a user
   * @param {JWT token} token
   * @param {ObjectId} card
   */
  getCard(token, card) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(
          `${config.get("api.base")}/card/${card}`,
          {
            headers: {
              "x-auth-token": token,
            },
          }
        );
        resolve(response.data);
      } catch (error) {
        reject(error.response.data);
      }
    });
  }

  /**
   * Update user FCMToken from firebase
   * @param {Object} body
   * @param {Auth user} user
   */
  updateFCMToken(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        await User.updateOne({ userId: user.id }, { FCMToken: body.FCMToken });

        resolve(null);
      } catch (error) {
        console.log("error", error);
        reject({ code: 404, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get user pending order list
   * @param {Auth user} user
   */
  getUserPendingOrder(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const order = await Order.find({
          user: user.id,
          status: { $ne: "delivered" },
        })
          .populate("rider", "name email phoneNumber countryCode")
          .populate(
            "entry",
            "status type source paymentMethod transaction itemType TEC TED TET"
          )
          .populate(
            "company",
            "name email phoneNumber type logo address countryCode"
          )
          .populate("transaction");

        resolve(order);
      } catch (error) {
        console.log("error", error);
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get user delievered order
   * @param {Auth user} user
   * @param {number} skip
   * @param {number} pageSize
   */
  getUserDeliveredOrder(user, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const order = await Order.find({
          rider: user.id,
          status: "delivered",
        })
          .populate("user", "name email phoneNumber countryCode")
          .populate(
            "entry",
            "status type source paymentMethod transaction itemType TEC TED TET"
          )
          .populate(
            "company",
            "name email phoneNumber type logo address countryCode"
          )
          .populate("transaction")
          .skip(skip)
          .limit(pageSize);

        const total = await Order.find({
          rider: user.id,
          status: "delivered",
        }).countDocuments();

        resolve({ order, total });
      } catch (error) {
        console.log("error", error);
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  // /**
  //  * Send OTP code to the
  //  * @param {Object} token otp code sent to the
  //  * @param {Object} entry
  //  * @param {Object} user
  //  */
  // sendUserPickupOTP(token, entry, user=null) {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       const token = GenerateOTP(4);

  //       const subject = "Pickup OTP Code";
  //       const html = OTPCode(token);
  //       Mailer(entry.email, subject, html);

  //       // send OTP code
  //       const notifyInstance = new NotificationService();
  //       const msg = `Your Pickup verification OTP code is ${token}`;
  //       const to = entry.countryCode + entry.phoneNumber;
  //       await notifyInstance.sendOTPByTermii(msg, to);

  //       if (user) {
  //         Mailer(user.email, subject, html);
  //         const toUser = user.countryCode + user.phoneNumber;
  //         await notifyInstance.sendOTPByTermii(msg, toUser);
  //       }

  //       resolve(token)
  //     } catch (error) {
  //       console.log("error", error);
  //     }
  //   })
  // }
}


module.exports = UserService;
