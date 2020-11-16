const Admin = require("../models/admin");
const moment = require("moment")
const { Mailer, GenerateToken } = require("../utils");
const { Verification } = require("../templates");


class AdminSerivice {
  // constructor() {
  //   this.createAdmin = createAdmin;
  // }

  createAdmin (body, user) {
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
    })
  }
}


module.exports = AdminSerivice;