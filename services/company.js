const bcrypt = require("bcrypt");
const moment = require("moment");
const mongoose = require("mongoose");
const Company = require("../models/company");
const Entry = require("../models/entry");
const Organization = require("../models/organization");
const Transaction = require("../models/transaction");
const template = require("../templates");
const { nanoid } = require("nanoid");
const { UploadFileFromBinary, Mailer, GenerateToken, isObject, convertToMonthlyDataArray } = require("../utils");
const { MSG_TYPES } = require("../constant/types");
const Order = require("../models/order");
const Rider = require("../models/rider");
const { ObjectId } = mongoose.Types;


class CompanyService {
  /**
   * Create a Company account
   * @param {String} body
   * @param {Object} user
   */
  create(body, files) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();
      try {
        const companyExist = await Company.findOne({
          $or: [{ email: body.email }, { phoneNumber: body.phoneNumber }],
        });
        if (companyExist) {
          reject({ code: 404, msg: "Account already exist." });
          return;
        }
        if (!files.cac) {
          reject({ code: 404, msg: "CAC Document is required" });
          return;
        }
        if (!files.poi) {
          reject({ code: 404, msg: "Proof of Identity Document is required" });
          return;
        }
        if (!files.poa) {
          reject({ code: 404, msg: "Proof of Address Document is required" });
          return;
        }
        if (!files.insuranceCert) {
          reject({
            code: 404,
            msg: "Insurance Certificate Document is required",
          });
          return;
        }
        if (!files.logo) {
          reject({ code: 404, msg: "Company Logo is required" });
          return;
        }

        const cac = await UploadFileFromBinary(files.cac.data, files.cac.name);
        const poi = await UploadFileFromBinary(files.poi.data, files.poi.name);
        const poa = await UploadFileFromBinary(files.poa.data, files.poa.name);
        const insuranceCert = await UploadFileFromBinary(
          files.insuranceCert.data,
          files.insuranceCert.name
        );
        const logo = await UploadFileFromBinary(
          files.logo.data,
          files.logo.name
        );
        body.logo = logo.Key;
        body.cac = cac.Key;
        body.poi = poi.Key;
        body.poa = poa.Key;
        body.insuranceCert = insuranceCert.Key;

        session.startTransaction();
        const token = GenerateToken(225);
        body.rememberToken = {
          token,
          expiredDate: moment().add(2, "days"),
        };
        body.publicToken = nanoid(50);
        body.password = await bcrypt.hash(body.password, 10);
        const organization = new Organization(body);
        const company = new Company(body);

        company.organization = organization._id;
        organization.companyHQ = company._id;
        organization.companies = [company._id];

        await company.save({ session: session });
        await organization.save({ session: session });
        await session.commitTransaction();
        session.endSession();

        const subject = "Welcome to Exalt Logistics";
        const html = template.Verification(token, body.email, "company");
        Mailer(body.email, subject, html);
        resolve({ company, organization });
      } catch (error) {
        session.abortTransaction();
        console.log("error", error);
        reject({ code: 500, msg: "Server Error" });
        return
      }
    });
  }

  /**
   * Check if a company already exist
   * @param {Object} filter
   * @param {Object} option
   */
  validateCompany(filter = {}, option = null) {
    return new Promise(async (resolve, reject) => {
      const select = option ? option : { password: 0, rememberToken: 0 };
      const company = await Company.findOne(filter).select(select);

      if (company) {
        reject({ code: 400, msg: MSG_TYPES.ACCOUNT_EXIST });
      }
      resolve(company);
    });
  }

  /**
   * Get a single Company
   * @param {Object} filter
   * @param {Object} option
   */
  get(filter = {}, option = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const select = option ? option : { password: 0, rememberToken: 0 };
        const company = await Company.findOne(filter).select(select);

        if (!company) {
          reject({ code: 404, msg: "No company was found." });
          return;
        }

        resolve(company);
      } catch (error) {
        console.log("error", error);
        reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        return;
      }
    });
  }

  /**
   * Get multiple company based on the filer parameters
   * @param {Object} filter
   * @param {Object} option
   * @param {String} populate
   */
  getAll(filter = {}, option = null, populate = "") {
    return new Promise(async (resolve, reject) => {
      const select = option ? option : { password: 0, rememberToken: 0 };
      const company = await Company.find(filter)
        .select(select)
        .populate(populate);

      resolve(company);
    });
  }

  /**
   * Get all Transactions for a company
   * @param {MongoDB ObjectId} company
   * @param {number} skip
   * @param {number} pageSize
   */
  allTransactions(company, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      const transactions = await Transaction.find({ company })
        .populate("entry", "status pickupAddress deliveryAddresses")
        .populate("user", "name")
        .populate("rider", "name")
        .skip(skip)
        .limit(pageSize)
        .sort({createdAt: "desc"});

      const total = await Transaction.find({
        company,
      }).countDocuments();

      resolve({ transactions, total });
    });
  }

  /**
   * Get all entry accepted by a company
   * @param {MongoDB ObjectId} authUser
   * @param {number} skip
   * @param {number} pageSize
   */
  getAllEntries(user, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const companyDetails = await Company.findOne({
          _id: user.id,
          verified: true,
          status: "active",
        });

        if (!companyDetails) {
          reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
          return;
        }

        const entry = await Entry.find({ company: user.id })
          .select({ metaData: 0 })
          .skip(skip)
          .limit(pageSize)
          .sort({createdAt: "desc"});

        const total = await Entry.find({
          company: user.id,
        }).countDocuments();

        resolve({ entry, total });
      } catch (error) {
        reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        return;
      }
    });
  }

  /**
   * Get a single entry by a company
   * @param {MongoDB ObjectId} authUser
   * @param {MongoDB ObjectId} entryId
   */
  getSingleEntry(user, entryId) {
    return new Promise(async (resolve, reject) => {
      const companyDetails = await Company.findOne({
        _id: user.id,
        verified: true,
        status: "active",
      });

      if (!companyDetails) {
        reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        return;
      }

      const entry = await Entry.find({ company: user.id, _id: entryId })
        .populate("orders")
        .populate("transaction")
        .populate("user", "name countryCode phoneNumber")
        .populate("rider", "email onlineStatus name countryCode phoneNumber")
        .select({ metaData: 0 })

      resolve({ entry });
    });
  }


  /**
  * Update company
  * @param {Object} updateObject
  */
  updateCompany(company, updateObject) {
    return new Promise(async (resolve, reject) => {
      try {
        const updatedCompany = await Company.updateOne(
          { _id: company },
          {
            $set: updateObject,
          }
        );
        resolve(updatedCompany)
      } catch (error) {
        reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
        return
      }
    })
  }

  /** DEPRECATED
  * GET a company's statistics - revenue, orders, riders summary
  * @param {ObjectId} companyId
  */
  getStatistics(companyId) {
    return new Promise(async (resolve, reject) => {
      try {
        const totalOrders = await Order.find({company: companyId}).countDocuments();
        const pendingOrders = await Order.find({company: companyId, status: "pending"}).countDocuments();
        const failedOrders = await Order.find({company: companyId, status: "cancelled"}).countDocuments();
        const successfulOrders = await Order.find({company: companyId, status: "delivered"}).countDocuments();
        const totalRiders = await Rider.find({company: companyId}).countDocuments();

        let totalRevenue = await Transaction.aggregate([
          { $match: {company: ObjectId(companyId),status: "approved",approvedAt: {$ne:null}} },
          { $group: { _id: companyId, "total": {$sum: "$amount"} }},
        ]);

        totalRevenue = totalRevenue[0] ? totalRevenue[0].total : 0;

        let monthlyRevenues = await Transaction.aggregate([
          { $match: {company: ObjectId(companyId), status: "approved"} },
          { $group:{ _id: {$month: "$approvedAt"}, revenue: {$sum: "$amount"}} },
          { $project: {_id:0, "month": "$_id", revenue: "$revenue"}}
        ]);

        let monthlyDeliveries = await Order.aggregate([
          { $match: {company: ObjectId(companyId), status: "delivered" } },
          { $group:{ _id: {$month: "$createdAt"}, numberOfDeliveries: {$sum: 1}} },
          { $project: {_id:0, "month": "$_id", numberOfDeliveries: "$numberOfDeliveries"}}
        ]);

        monthlyRevenues = convertToMonthlyDataArray(monthlyRevenues, 'revenue');
        monthlyDeliveries = convertToMonthlyDataArray(monthlyDeliveries, 'numberOfDeliveries');

        resolve({
          totalOrders,
          pendingOrders,
          failedOrders,
          successfulOrders,
          totalRiders,
          totalRevenue,
          monthlyRevenues,
          monthlyDeliveries,
        })
      } catch (error) {
        console.log('Error => ', error);
        reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
        return
      }
    })
  }

  /**
  * GET a company's rider statistics - revenue, orders, riders summary
  * @param {ObjectId} companyId
  * @param {Object} filter
  */
  getRiderStatistics(companyId, filter) {
    return new Promise(async (resolve, reject) => {
      try {
        let baseFilter = { company: companyId };
        if(isObject(filter)){
          baseFilter = {...baseFilter, ...filter};
        }

        const totalOrders = await Order.find({...baseFilter}).countDocuments();
        const successfulOrders = await Order.find({...baseFilter, status: "delivered"}).countDocuments();
        const failedOrders = await Order.find({...baseFilter, status: "cancelled"}).countDocuments();
        const activeOrders = await Order.find({
          ...baseFilter,
          status: {
            $nin: ["pending","delivered","cancelled","declined"]
        }}).countDocuments();
        // @TODO: Get the correct values for this field
        const totalRevenue = 0;

        const isSingleRider = baseFilter.hasOwnProperty('rider');

        const totalRiders = await Rider.find(baseFilter).countDocuments();
        const activeRiders = await Rider.find({...baseFilter, status: "active"}).countDocuments();

        let statistics = {
          totalOrders,
          successfulOrders,
          activeOrders,
          failedOrders,
          totalRevenue,
        }

        if(!isSingleRider){
          statistics = { ...statistics, totalRiders, activeRiders };
        }

        resolve(statistics);
      } catch (error) {
        reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
        return
      }
    })
  }

  /**
  * GET a company's transaction statistics
  * @param {ObjectId} companyId
  */
 getTransactionStatistics(companyId) {
  return new Promise(async (resolve, reject) => {
    try {
      const totalTransactions = await Transaction.find({company: companyId}).countDocuments();
      const failedTransactions = await Transaction.find({company: companyId, status: "declined"}).countDocuments();
      const totalRiders = await Rider.find({company: companyId}).countDocuments();

      let totalRevenue = await Transaction.aggregate([
        { $match: {company: ObjectId(companyId),status: "approved",approvedAt: {$ne:null}} },
        { $group: { _id: companyId, "total": {$sum: "$amount"} }},
      ]);

      totalRevenue = totalRevenue[0] ? totalRevenue[0].total : 0;

      resolve({
        totalTransactions,
        failedTransactions,
        totalRiders,
        totalRevenue,
      });
    } catch (error) {
      console.log('Error => ', error);
      reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
      return
    }
  })
}

   /**
   * Update password
   * @param {Object} body request body object
   * @param {ObjectId} companyId
   */
  updatePassword(companyId, body) {
    return new Promise(async (resolve, reject) => {
      const company = await Company.findOne({
        _id: companyId,
        verified: true,
        status: "active",
      });

      if (!company) {
        return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
      }

      let validPassword = await bcrypt.compare(
        body.oldPassword,
        company.password
      );
      if (!validPassword) {
        return reject({ code: 400, msg: "Old password incorrect" });
      }
      const updatedPassword = await bcrypt.hash(body.newPassword, 10);
      const updatedCompany = await Company.updateOne(
        { _id: companyId },
        {
          $set: {
            password: updatedPassword,
          },
        }
      );

      resolve(updatedCompany);
    });
  }

}

module.exports = CompanyService;
