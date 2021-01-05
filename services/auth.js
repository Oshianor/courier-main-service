const config = require("config");
const moment = require("moment");
const bcrypt = require("bcrypt");
const axios = require("axios");
const Rider = require("../models/rider");
const User = require("../models/users");
const { Verification } = require("../templates");
const { MSG_TYPES } = require("../constant/types");
const { Mailer, GenerateToken, GenerateOTP } = require("../utils");
const OTPCode = require("../templates/otpCode");

class AuthSerivice {
  /**
   * Login user
   * @param {Object} body
   */
  loginUser(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(
          `${config.get("api.base")}/auth/login`,
          body
        );
        console.log("response", response);
        if (response.status == 200) {
          const token = response.headers["x-auth-token"];
          const exaltUser = response.data.data;
          const logisticUser = await User.findById(exaltUser._id);
          if (logisticUser) {
            resolve({ user: logisticUser, token });
          } else {
            const user = await User.create(exaltUser);
            resolve({ user, token });
          }
        } else {
          return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
        }
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
   * Validate forgot password email and send OTP
   * @param {String} email
   */
  forgotPassEmailValidate(email) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({
          email: email,
          verified: true,
          status: "active",
        });
        if (!rider) {
          reject({ code: 400, msg: MSG_TYPES.ACCOUNT_INVALID });
          return;
        }
        const forgotPassOTP = GenerateOTP(4);
        const forgotPassOTPExpiredDate = moment().add(20, "minutes");

        const updateRider = await Rider.updateOne(
          { email: email },
          {
            $set: {
              forgotPassOTP: forgotPassOTP,
              forgotPassOTPExpiredDate: forgotPassOTPExpiredDate,
            },
          }
        );
        // send OTP code to the receipant
        const subject = "Account Recovery Code";
        const html = OTPCode(forgotPassOTP);
        Mailer(email, subject, html);

        resolve(updateRider);
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return;
      }
    });
  }

  /**
   * Validate forgot password OTP
   * @param {String} email
   * @param {String} otp
   */
  forgotPassOTPValidate(email, otp) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({
          email: email,
          forgotPassOTP: otp,
          verified: true,
          status: "active",
        });
        if (!rider) {
          reject({ code: 400, msg: "OTP invalid" });
          return;
        }
        if (moment(rider.forgotPassOTPExpiredDate).isSameOrAfter(moment())) {
          reject({ code: 400, msg: "OTP Expired Try Again" });
          return;
        }
        const updateRider = await Rider.updateOne(
          { email: email },
          {
            $set: {
              forgotPassOTP: null,
              forgotPassOTPExpiredDate: null,
            },
          }
        );
        resolve(updateRider);
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return;
      }
    });
  }

  /**
   * Reset password
   * @param {String} email
   * @param {String} password
   */
  resetPassword(email, password) {
    return new Promise(async (resolve, reject) => {
      const activeRider = await Rider.findOne({
        email: email,
        verified: true,
        status: "active",
      });

      if (!activeRider) {
        reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        return;
      }
      const updatedPassword = await bcrypt.hash(password, 13);
      const updateRider = await Rider.updateOne(
        { email: email },
        {
          $set: {
            password: updatedPassword,
          },
        }
      );

      resolve(updateRider);
    });
  }

  /**
   * Update password
   * @param {Object} body request body object
   */
  updatePassword(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const activeRider = await Rider.findOne({
          _id: body.rider,
          verified: true,
          status: "active",
        });

        if (!activeRider) {
          reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
          return;
        }

        let validPassword = await bcrypt.compare(
          body.oldPassword,
          activeRider.password
        );
        if (!validPassword) {
          reject({ code: 400, msg: "Wrong Password Entered" });
          return;
        }
        const updatedPassword = await bcrypt.hash(body.newPassword, 13);
        const updateRider = await Rider.updateOne(
          { _id: body.rider },
          {
            $set: {
              password: updatedPassword,
            },
          }
        );
        resolve({ updateRider });
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return;
      }
    });
  }
}

module.exports = AuthSerivice;



  // loginUser(body) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const response = await axios.post(
  //         `${config.get("api.base")}/auth/login`,
  //         body
  //       );
  //       console.log("response", response);
  //       if (response.status == 200) {
  //         const token = response.headers["x-auth-token"];
  //         const exaltUser = response.data.data;
  //         const logisticUser = await User.findById(exaltUser._id);
  //         if (logisticUser) {
  //           resolve({ user: logisticUser, token });
  //         } else {
  //           const user = await User.create(exaltUser);
  //           resolve({ user, token });
  //         }
  //       } else {
  //         return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
  //       }
  //     } catch (error) {
  //       reject({
  //         code: error.response.status,
  //         msg: error.response.data.msg,
  //       });
  //       return;
  //     }
  //   });
  // }


    // loginUser(body) {
  //   return new Promise(async (resolve, reject) => {
  //     axios.post(
  //       `${config.get("api.base")}/auth/login`,
  //       body
  //     ).then(async res => {
  //       console.log("res", res);
  //       if (res.status == 200) {
  //         const token = res.headers["x-auth-token"];
  //         const exaltUser = res.data.data;
  //         const logisticUser = await User.findById(exaltUser._id);
  //         if (logisticUser) {
  //           resolve({ user: logisticUser, token });
  //         } else {
  //           const user = await User.create(exaltUser);
  //           resolve({ user, token });
  //         }
  //       } else {
  //         return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
  //       }
  //     }).catch ((error) => {
  //       console.log("error", error);
  //       reject({
  //         code: error.response.status,
  //         msg: error.response.data.msg,
  //       });
  //       return;
  //     })
  //   });
  // }