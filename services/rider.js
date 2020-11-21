const Admin = require("../models/admin");
const moment = require("moment");
const RiderCompanyRequest = require("../models/riderCompanyRequest");
const Rider = require("../models/rider");
const { Verification } = require("../templates");
const { MSG_TYPES } = require("../constant/types");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../utils");

class RiderSerivice {
  /**
   * Create Rider account
   * @param {*} req
   * @param {*} res
   */
  create(body, files) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({
          $or: [{ phoneNumber: body.phoneNumber }, { email: body.email }],
        });
        if (rider) {
          reject({ code: 400, msg: MSG_TYPES.ACCOUNT_EXIST });
          return;
        }

        if (files.POI) {
          const POI = await UploadFileFromBinary(
            files.POI.data,
            files.POI.name
          );
          body.POI = POI.Key;
        }

        if (files.img) {
          const img = await UploadFileFromBinary(
            files.img.data,
            files.img.name
          );
          body.img = img.Key;
        }

        const token = GenerateToken(225);
        body.rememberToken = {
          token,
          expiredDate: moment().add(2, "days"),
        };

        const newRider = new Rider(body);

        await newRider.save();

        const subject = "Welcome to Exalt Logistics";
        const html = Verification(token, body.email, "rider");
        Mailer(body.email, subject, html);
        
        newRider.rememberToken = null;
        resolve(newRider);
      } catch (error) {
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
        return
      }
    })
  }

  /**
   * Send a request to a company
   * @param {String} company 
   * @param {String} rider 
   */
  sendCompanyRequest(company, rider) {
    return new Promise(async (resolve, reject) => {
      const request = new RiderCompanyRequest({
        company: company,
        rider: rider,
        status: "pending",
      });
      await request.save();

      resolve(request);
    })
  }

}

module.exports = RiderSerivice;
