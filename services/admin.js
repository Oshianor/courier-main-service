const Admin = require("../models/admin");
const moment = require("moment")
const { Mailer, GenerateToken } = require("../utils");
const { Verification } = require("../templates");
const { options } = require("joi");
const { MSG_TYPES } = require("../constant/types");


class AdminSerivice {
  /**
   * Create Admin service
   * @param {Sting} body
   * @param {String} user
   */
  createAdmin(body, user) {
    return new Promise(async (resolve, reject) => {
      // check if an existing admin has incoming email
      const adminCheck = await Admin.findOne({
        $or: [{ email: body.email }, { phoneNumber: body.phoneNumber }],
      });
      if (adminCheck) {
        reject({ code: 400, msg: `\"email or phoneNumber "\ already exists!` });
        return;
      }

      const token = GenerateToken(225);
      body.rememberToken = {
        token,
        expiredDate: moment().add(2, "days"),
      };
      body.createdBy = user.id;
      const admin = await Admin.create(body);

      const subject = "Welcome to Exalt Logistics Admin";
      const html = Verification(token, body.email, "admin");
      await Mailer(body.email, subject, html);

      resolve(admin);
      return;
    });
  }

  /**
   * Get a single Admin
   * @param {Object} filter 
   * @param {Object} option 
   */
  get (filter={}, option = null) {
    return new Promise(async (resolve, reject) => {
      const select = option ? option : { password: 0, rememberToken: 0 };
      const admin = await Admin.findOne(filter).select(select);

      if (!admin) {
        reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
      }
      resolve(admin);
    })
  }

  /**
   * Get multiple admin based on the filer parameters
   * @param {Object} filter 
   * @param {Object} option 
   * @param {String} populate 
   */
  getAll (filter={}, option=null, populate="") {
    return new Promise(async (resolve, reject) => {
      const select = option ? option : { password: 0, rememberToken: 0 };
      const admin = await Admin.find(filter).select(select).populate(populate);

      // if (!admin) {
      //   reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
      // }
      resolve(admin);
    })
  }



}


module.exports = AdminSerivice;