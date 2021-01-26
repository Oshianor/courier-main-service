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
const EnterpriseService = require("../services/enterprise");
const UserService = require("../services/user");
const { ACCOUNT_SERVICE } = require("../constant/api");
const enterpriseInstance = new EnterpriseService();



class AuthSerivice {
  /**
   * Login user
   * @param {Object} body
   */
  loginUser(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(
          `${config.get("api.base")}${ACCOUNT_SERVICE.LOGIN}`,
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
          return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
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
        const forgotPassOTPExpiredDate = moment(currentDate)
          .add(4, "m")
          .toDate();

        const updateRider = await Rider.updateOne(
          { email: email },
          {
            $set: {
              rememberToken: {
                token: forgotPassOTP,
                expiredDate: forgotPassOTPExpiredDate,
              },
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
        if (moment().isSameOrAfter(moment(rider.rememberToken.expiredDate))){
          return reject({ code: 400, msg: "OTP Expired Try Again" });
        }
        const updateRider = await Rider.updateOne(
          { email: email },
          {
            $set: {
              rememberToken: null,
            },
          }
        );
        resolve(updateRider);
      } catch (error) {
        console.log(error);
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
        const response = await axios.post(
          `${config.get("api.base")}${ACCOUNT_SERVICE.VERIFY_ACCOUNT}`,
          body,
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );

        const user = await User.findById(response.data.data._id);
        if (!user) {
          return reject({ code: 400, msg: "No User Account found" });
        }

        if (user.role !== "maintainer") {
          await enterpriseInstance.updateEnterprise(
            { _id: user.enterprise },
            {
              verified: true,
              status: "active",
            }
          );
        }

        resolve(response.data);
      } catch (error) {
        console.log("error", error);
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
          `${config.get("api.base")}${ACCOUNT_SERVICE.LOGIN}`,
          body
        );
        const token = response.headers["x-auth-token"];
        const exaltUser = response.data.data;
        const localUser = await User.findById(exaltUser._id).populate(
          "enterprise",
          "name type phoneNumber email address logo motto industry"
        );

        resolve({ token, exaltUser, localUser });
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
   * Disable Branch/Maintainer
   * @param {Object} body req body
   * @param {Object} user auth user data
   * @param {Object} enterprise
   */
  updateEnterpriseAccountStatus(body, user, enterprise) {
    return new Promise(async (resolve, reject) => {
      try {
        const account = await User.findOne({
          _id: body.account,
        });

        if (!account) {
          return reject({
            code: 400,
            msg: "You do not have permission to disable this account",
          });
        }

        if (user.role !== "owner" && user.role !== "branch") {
          return reject({
            code: 400,
            msg: "You do not have permission to disable this account",
          });
        }

        if (account.role === "maintainer") {
          if (String(account.enterprise) !== String(user.enterprise)) {
            return reject({
              code: 400,
              msg: "You do not have permission to disable this account",
            });
          }

          const userInstance = new UserService();
          const updatedUser = await userInstance.updateBranchAndMaintainers(
            body
          );

          resolve(updatedUser.data);
        }

        // to disable branch, check if user has role of owner
        if (user.role === "owner") {
          if (account.role === "branch") {
            const enterprise = await Enterprise.findOne({
              _id: account.enterprise,
            });
            body.maintainers = enterprise.maintainers;
            const userInstance = new UserService();
            const updatedUser = await userInstance.updateBranchAndMaintainers(
              body
            );

            resolve(updatedUser.data);
          }
        }
      } catch (error) {
        return reject(error);
      }
    });
  }

  /**
   * Disable user account
   * @param {Object} body req body
   */
  updateUserStatus(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const userInstance = new UserService();
        const updatedUser = await userInstance.updateBranchAndMaintainers(
          body
        );

        resolve(updatedUser.data);
      } catch (error) {
        return reject(error);
      }
    });
  }
}

module.exports = AuthSerivice;