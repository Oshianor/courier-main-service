const config = require("config");
const moment = require("moment");
const bcrypt = require("bcrypt");
const axios = require("axios");
const Rider = require("../models/rider");
const User = require("../models/users");
const Enterprise = require("../models/enterprise");
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
   * Validate forgot password email and send OTP (FORGOT PASSWORD MODULE)
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
        const currentDate = new Date();
        const forgotPassOTPExpiredDate = moment(currentDate).add(4, 'm').toDate();


        const updateRider = await Rider.updateOne(
          { email: email },
          {
            $set: {
              rememberToken: {
                token: forgotPassOTP,
                expiredDate: forgotPassOTPExpiredDate
              }
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
 * Validate forgot password OTP (FORGOT PASSWORD MODULE)
 * @param {String} email
 * @param {String} otp
 */
  forgotPassOTPValidate(email, otp) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({
          email: email,
          verified: true,
          status: "active",
        });
        if (rider.rememberToken.token !== otp) {
          reject({ code: 400, msg: "OTP invalid" });
          return;
        }
        if (moment(rider.rememberToken.expiredDate).isSameOrAfter(moment())) {
          reject({ code: 400, msg: 'OTP Expired Try Again' });
          return;
        }
        const updateRider = await Rider.updateOne(
          { email: email },
          {
            $set: {
              rememberToken: null
            },
          }
        );
        resolve(updateRider);
      } catch (error) {
        console.log(error)
        reject({ code: error.code, msg: error.msg });
        return;
      }
    });
  }

  /**
   * Reset password (FORGOT PASSWORD MODULE)
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
   * Set password (ENTERPRISE SETUP)
   * @param {Object} body
   */

  setPassword(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const userObject = {
          email: body.email,
          password: body.password
        }
        const response = await axios.post(`${config.get("api.base")}/auth/set-password`, userObject);
        if (response.status == 200) {
          resolve(response.data);
        }
        return reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });

      } catch (error) {
        if (error.response) {
          return reject({ code: error.response.status, msg: error.response.data.msg });
        }
        return reject({ code: error.code, msg: error.msg });

      }

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

  /**
   * Enterprise login
   * @param {Object} body
   */
  enterpriseLogin(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(
          `${config.get("api.base")}/auth/login`,
          body
        );
        if (response.status == 200) {
          const token = response.headers["x-auth-token"];
          const exaltUser = response.data.data;
          const enterpriseUser = await Enterprise.find({ user: exaltUser._id }).select(' -createdBy -deleted -deletedBy -deletedAt')
            .populate('enterprise', 'name type phoneNumber email address')
            .populate('branchIDS', 'name type phoneNumber email address')
            .populate('maintainer', 'name type phoneNumber email address');

          if (!enterpriseUser) {
            return reject({ code: 400, msg: MSG_TYPES.PERMISSION });
          }
          resolve({ enterpriseUser, token });
          return
        } else {
          return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
        }
      } catch (error) {
        if (error.response) {
          return reject({ code: error.response.status, msg: error.response.data.msg });
        }
        reject({ code: error.code, msg: error.msg });
        return
      }
    });
  }

  /**
   * Disable Branch/Maintainer
   * @param {Object} body
   */
  updateEnterpriseAccountStatus(body, enterprise) {
    return new Promise(async (resolve, reject) => {
      try {
        const account = await User.findOne({ _id: body.account, enterprise: enterprise._id })
        // if(account.group !== "enterprise"){
        //   return reject({ code: 400, msg: "Account selected is not an Enterprise account"})
        // }
        if (!account || account.role === "owner") {
          return reject({ code: 400, msg: "You do not have permission to disable this account" })
        }
        if (account.role == "branch" && enterprise.type !== "HQ") {
          return reject({ code: 400, msg: "You do not have permission to disable this account" })
        }
        const response = await axios.patch(
          `${config.get("api.base")}/auth/toggle-status`,
          body
        );
        if (response.status == 200) {
          resolve(response.data.data);
          return
        } else {
          return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
        }
      } catch (error) {
        if (error.response) {
          return reject({ code: error.response.status, msg: error.response.data.msg });
        }
        reject({ code: error.code, msg: error.msg });
        return
      }
    });
  } ß
}

module.exports = AuthSerivice;