const Admin = require("../models/admin");
// const Enterprise = require("../models/enterprise");
const Order = require("../models/order");
const Transaction = require("../models/transaction");
const moment = require("moment")
const Rider = require("../models/rider");
const { Mailer, GenerateToken, convertToMonthlyDataArray } = require("../utils");
const { Verification } = require("../templates");
const { MSG_TYPES } = require("../constant/types");


class AdminService {
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
  get(filter = {}, option = null) {
    return new Promise(async (resolve, reject) => {
      const select = option ? option : { password: 0, rememberToken: 0 };
      const admin = await Admin.findOne(filter).select(select);

      if (!admin) {
        return reject({ code: 404, msg: "Admin not found" });
      }
      resolve(admin);
    });
  }

  /**
   * Get multiple admin based on the filer parameters
   * @param {Object} filter
   * @param {Object} option
   * @param {String} populate
   */
  getAll(filter = {}, option = null, populate = "") {
    return new Promise(async (resolve, reject) => {
      const select = option ? option : { password: 0, rememberToken: 0 };
      const admin = await Admin.find(filter).select(select).populate(populate);

      // if (!admin) {
      //   reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
      // }
      resolve(admin);
    });
  }

  /**
   * Get all Riders
   * @param {MongoDB ObjectId} company
   * @param {number} skip
   * @param {number} pageSize
   */
  getAllRider(company, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      const rider = await Rider.find({ company })
        .select("-password -rememberToken")
        .populate("vehicles")
        .skip(skip)
        .limit(pageSize);

      const total = await Rider.find({
        company,
      }).countDocuments();

      resolve({ rider, total });
    });
  }

  /**
   * Change admin Password
   * @param {Express req *} body
   * @param {Auth user} user
   */
  changePassword(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const admin = await Admin.get({ _id: user.id });

        let validPassword = await bcrypt.compare(
          body.oldPassword,
          admin.password
        );

        if (!validPassword) {
          reject({ code: 403, msg: MSG_TYPES.INVALID_PASSWORD });
          return;
        }

        admin.password = await bcrypt.hash(body.password, 10);

        await admin.save();

        resolve(admin);
      } catch (error) {
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  // [moved to accounts-service]
  /**
 * Verify branch
 * @param {Object} body
 */
  // verifyBranch(branchId) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
        // const branch = await Enterprise.findOne({ _id: branchId, type: "Branch" });
        // if (!branch) {
        //   reject({ code: 400, msg: "Branch does not exist" });
        //   return;
        // }
        // if (branch.verified == true) {
        //   reject({ code: 400, msg: "Already Verified" });
        //   return;
        // }
        // const updatedEnterprise = await Enterprise.updateOne(
        //   { _id: branchId },
        //   {
        //     $set: { verified: true },
        //   }
        // );
        // resolve(updatedEnterprise);
  //     } catch (error) {
  //       reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
  //     }
  //   });
  // }
}


module.exports = AdminService;