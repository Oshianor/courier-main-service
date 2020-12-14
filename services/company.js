const bcrypt = require("bcrypt");
const moment = require("moment");
const mongoose = require("mongoose");
const Pricing = require("../models/pricing");
const Company = require("../models/company");
const Organization = require("../models/organization");
const template = require("../templates");
const { nanoid } = require("nanoid");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../utils");
const { MSG_TYPES } = require("../constant/types");

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

        const pricing = await Pricing.findOne({ _id: body.tier });
        if (!pricing) {
          reject({ code: 404, msg: MSG_TYPES.FREEMIUM });
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
        const insuranceCert = await UploadFileFromBinary(files.insuranceCert.data,files.insuranceCert.name);
        const logo = await UploadFileFromBinary(files.logo.data,files.logo.name);
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
        body.tier = pricing;
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
          reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
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
        .skip(skip)
        .limit(pageSize);

      const total = await Transaction.find({
        company,
      }).countDocuments();

      resolve({ transactions, total });
    });
  }
}

module.exports = CompanyService;
