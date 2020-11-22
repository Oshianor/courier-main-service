const Admin = require("../models/admin");
const moment = require("moment");
const RiderCompanyRequest = require("../models/riderCompanyRequest");
const Rider = require("../models/rider");
const Company = require("../models/company");
const { Verification } = require("../templates");
const { MSG_TYPES } = require("../constant/types");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../utils");
const Order = require("../models/order");

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
        return;
      }
    });
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
    });
  }

  /**
   * Update rider FCMToken from firebase
   * @param {Req} body
   * @param {Auth user} user
   */
  updateFCMToken(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({ _id: user.id, status: "active" });
        if (!rider) {
          reject({ code: 404, msg: "No Account found" });
          return;
        }

        await rider.updateOne({ FCMToken: body.FCMToken });

        resolve(rider);
      } catch (error) {
        console.log("error", error2);
        reject({ code: 404, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Delete One Rider by company
   * @param {Req} params
   * @param {Auth user} user
   */
  destory(params, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const company = await Company.findOne({ _id: user.id });
        if (!company) {
          reject({ code: 404, msg: "Company Not Found!" });
          return;
        }

        const rider = await Rider.findOne({
          _id: params.riderId,
          company: company._id,
        });
        if (!rider) {
          reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
          return;
        }

        rider.deletedBy = user.id;
        rider.deleted = true;
        rider.deletedAt = Date.now();
        await rider.save();

        resolve(rider);
      } catch (error) {
        reject({ code: 404, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get rider accepted order list
   * @param {Auth user} user
   */
  getRiderBasket(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({ _id: user.id, status: "active" });
        if (!rider) {
          reject({ code: 404, msg: "Account not found" });
          return;
        }
        
        const order = await Order.find({
          rider: user.id,
          status: { $ne: "delivered" },
          // createdAt: { $gte: start, $lt: end },
        })
          .populate("user", "name email phoneNumber countryCode")
          .populate(
            "company",
            "name email phoneNumber type logo address countryCode"
          );

        resolve(order);
      } catch (error) {
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
      }
    });
  }
}

module.exports = RiderSerivice;
