const config = require("config");
const axios = require("axios");
// const User = require("../models/users");
const Order = require("../models/order");
const moment = require("moment");
const { MSG_TYPES } = require("../constant/types");
const { ACCOUNT_SERVICE } = require("../constant/api");
const NotificationService = require("./notification");
const { GenerateOTP, Mailer } = require("../utils");
const { OTPCode } = require("../templates");

/**
 * User service class
 */
class UserService {
  /**
   * Update user account - request to account service
   * @param {Object} body
   */
  updateExaltUser(userAuthToken, body) {
    return new Promise(async (resolve, reject) => {
      const accountUpdateData = {
        name: body.name,
        phoneNumber: body.phoneNumber,
      };

      try {
        const response = await axios.patch(
          `${config.get("api.base")}${ACCOUNT_SERVICE.UPDATE_USER}`,
          accountUpdateData,
          {
            headers: {
              "x-auth-token": userAuthToken,
            },
          }
        );
        resolve(response.data.data);
      } catch (error) {
        if (error.response) {
          return reject({
            code: error.response.status,
            msg: error.response.data.msg,
          });
        }
        return reject(error);
      }
    });
  }

  /**
   * Delete user account
   * @param {body} body
   */
  deleteUser(userId) {
    return new Promise(async (resolve, reject) => {
      try {
        await axios.delete(
          `${config.get("api.base")}${ACCOUNT_SERVICE.USER}/${userId}`,
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );

        resolve();
      } catch (error) {
        reject({
          code: error.response.status,
          msg: error.response.data.msg,
        });
        return;
      }
    });
  }

  /**
   * Get a user by it's token
   * @param {String} token
   */
  get(token) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(
          `${config.get("api.base")}${ACCOUNT_SERVICE.USER}`,
          {
            headers: {
              "x-auth-token": token,
            },
          }
        );
        // console.log("response", response);
        resolve(response.data);
      } catch (error) {
        console.log("User not found", error);
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
        const response = await axios.get(
          `${config.get("api.base")}${ACCOUNT_SERVICE.GET_ALL_USER}`,
          {
            filter,
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
   * Get a single user by it's ID
   * @param {ObjectId} filter
   */
  getByID(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(
          `${config.get("api.base")}${ACCOUNT_SERVICE.USER}/${id}`,
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
          `${config.get("api.base")}${ACCOUNT_SERVICE.CARD}/${card}`,
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
   * Get a single card for enterprise
   * @param {ObjectId} user
   * @param {ObjectId} card
   */
  getSingleEnterpriseCard(user, card) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(
          `${config.get("api.base")}${ACCOUNT_SERVICE.E_CARD_SINGLE}`,
          {
            card,
            user,
          },
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
   * Get a list of users
   * @param {Array} users
   */
  getAllMaintainers(users) {
    return new Promise(async (resolve, reject) => {
      try {
        const mina = await axios.post(
          `${config.get("api.base")}${ACCOUNT_SERVICE.GET_MAINTAINERS}`,
          {
            maintainers: users,
          },
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );

        resolve(mina.data);
      } catch (error) {
        if (error.response) {
          return reject({
            code: error.response.status,
            msg: error.response.data.msg,
          });
        }
      }
    });
  }

  /**
   * Add card by for enterprise with account service wrapper
   * @param {Object} body
   */
  addEnterpriseCard(body, token) {
    return new Promise(async (resolve, reject) => {
      try {
        const card = await axios.post(
          `${config.get("api.base")}${ACCOUNT_SERVICE.ADD_E_CARD}`,
          body,
          {
            headers: {
              "x-auth-token": token,
              "api-key": config.get("api.key"),
            },
          }
        );

        console.log("card", card);

        resolve(card);
      } catch (error) {
        reject({ code: error.response.status, msg: error.response.data.msg });
        return;
      }
    });
  }

  /**
   * Update maintainers and branch by an owner
   * @param {Object} body
   */
  updateBranchAndMaintainers(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.patch(
          `${config.get("api.base")}${ACCOUNT_SERVICE.TOGGLE_STATUS}`,
          body,
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );
        resolve(response.data);
      } catch (error) {
        reject({ code: error.response.status, msg: error.response.data.msg });
        return;
      }
    });
  }

  /**
   * Get all card for enterprise account
   * @param {ObjectId} user the user account to get their cards
   */
  getAllEnterpriseCard(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(
          `${config.get("api.base")}${ACCOUNT_SERVICE.E_CARD_ALL}`,
          {
            user,
          },
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
   * Update user FCMToken from firebase
   * @param {Object} body
   * @param {Auth user} user
   */
  updateFCMToken(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        // await User.updateOne({ _id: user.id }, { FCMToken: body.FCMToken });

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
   * @param {number} skip
   * @param {number} pageSize
   */
  getUserPendingOrder(user, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const orders = await Order.find({
          user: user.id,
          $or: [
            { status: "pending" },
            { status: "enrouteToPickup" },
            { status: "arrivedAtPickup" },
            { status: "pickedup" },
            { status: "enrouteToDelivery" },
            { status: "arrivedAtDelivery" },
          ],
        })
          .populate("rider", "name email phoneNumber countryCode img")
          .populate(
            "entry",
            "status type source paymentMethod transaction itemType TEC TED TET vehicle pickupType instantPricing"
          )
          .populate("transaction")
          .populate("vehicle")
          .skip(skip)
          .limit(pageSize)
          .sort({ createdAt: -1 });

        const total = await Order.find({
          user: user.id,
          $or: [
            { status: "pending" },
            { status: "enrouteToPickup" },
            { status: "arrivedAtPickup" },
            { status: "pickedup" },
            { status: "enrouteToDelivery" },
            { status: "arrivedAtDelivery" },
          ],
        }).countDocuments();

        resolve({ orders, total });
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
        const orders = await Order.find({
          user: user.id,
          status: "delivered",
        })
          .populate(
            "entry",
            "status type source paymentMethod transaction itemType TEC TED TET vehicle pickupType instantPricing"
          )
          .populate("rider", "name email phoneNumber countryCode img")
          .populate("transaction")
          .populate("vehicle")
          .populate("userRating")
          .skip(skip)
          .limit(pageSize)
          .sort({ createdAt: -1 });

        const total = await Order.find({
          rider: user.id,
          status: "delivered",
        }).countDocuments();

        resolve({ orders, total });
      } catch (error) {
        console.log("error", error);
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  // This service is to update duplicated data silently on the logistics database.
  /**
   * Update a user's account details
   * @param {ObjectId} userId
   * @param {Object - {name, phoneNumber}} data
   */
  updateAccount(userId, data) {
    return new Promise(async (resolve, reject) => {
      try {
        // const user = await User.findOne({ _id: userId });
        // if (!user) {
        //   return reject({ statusCode: 404, msg: MSG_TYPES.NOT_FOUND });
        // }

        // const updatedUser = await User.updateOne(
        //   { _id: userId },
        //   { $set: data }
        // );
        // if (!updatedUser) {
        //   return reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR });
        // }
        // resolve(updatedUser);
      } catch (error) {
        return reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   *
   * @param {string} userId
   * @returns logistics user account
   */
  getUser(userId) {
    return new Promise(async (resolve, reject) => {
      try {
        // const user = await User.findOne({ _id: userId })

        // if(!user){
        //   return reject({ code: 404, msg: 'User '+MSG_TYPES.NOT_FOUND});
        // }

        // resolve(user);
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }
}

module.exports = UserService;