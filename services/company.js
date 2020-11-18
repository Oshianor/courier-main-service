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
        const pricing = await Pricing.findOne({ _id: body.tier });
        if (!pricing) {
          reject({ code: 404, msg: MSG_TYPES.FREEMIUM });
          return;
        }

        if (files.rcDoc) {
          const rcDoc = await UploadFileFromBinary(
            files.rcDoc.data,
            files.rcDoc.name
          );
          body.rcDoc = rcDoc.Key;
        } else {
          reject({ code: 404, msg: "Document is required" });
          return;
        }
        if (files.logo) {
          const logo = await UploadFileFromBinary(
            files.logo.data,
            files.logo.name
          );
          body.logo = logo.Key;
        } else {
          reject({ code: 404, msg: "Document is required" });
          return;
        }

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
          reject({ code: 400, msg: MSG_TYPES.NOT_FOUND });
        }
        resolve(company);
      } catch (error) {
        console.log("error", error);
        reject({ code: 400, msg: MSG_TYPES.NOT_FOUND });
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
}

module.exports = CompanyService;
