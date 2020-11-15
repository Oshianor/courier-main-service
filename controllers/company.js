const bcrypt = require("bcrypt");
const moment = require("moment");
const mongoose = require("mongoose");
const {
  Company,
  validateUpdateCompany,
  validateStatusUpdate,
  validateCompanyVerification,
} = require("../models/company");
const { Organization } = require("../models/organization");
const { Pricing } = require("../models/pricing");
const { Vehicle } = require("../models/vehicle");
const { Country } = require("../models/countries");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { nanoid } = require("nanoid");
const { Rider } = require("../models/rider");
const { Setting } = require("../models/settings");
const template = require("../templates");
const {
  UploadFileFromBinary,
  Mailer,
  GenerateToken,
  paginate,
} = require("../utils");

/**
 * Create Company
 * @param {*} req
 * @param {*} res
 */
exports.company = async (req, res) => {
  try {
    req.body.vehicles = req.body.vehicles.split(",");
    const { error } = validateCompany(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if an existing company  has incoming email
    const accountCheck = await Company.findOne({
      $or: [{ email: req.body.email }, { phoneNumber: req.body.phoneNumber }],
    });
    if (accountCheck)
      return JsonResponse(
        res,
        400,
        `\"email"\ or \"Phone Number"\ already exists!`,
        null,
        null
      );

    const pricing = await Pricing.findOne({ _id: req.body.tier });
    if (!pricing) return JsonResponse(res, 404, MSG_TYPES.FREEMIUM, null, null);

    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    const vehicle = await Vehicle.find({
      _id: { $in: req.body.vehicles },
    }).countDocuments();
    if (vehicle !== req.body.vehicles.length)
      return JsonResponse(res, 404, "Please provide vehicles", null, null);

    // return;
    // console.log("req.files", req.files);
    if (req.files.rcDoc) {
      const rcDoc = await UploadFileFromBinary(
        req.files.rcDoc.data,
        req.files.rcDoc.name
      );
      req.body.rcDoc = rcDoc.Key;
    }
    if (req.files.logo) {
      const logo = await UploadFileFromBinary(
        req.files.logo.data,
        req.files.logo.name
      );
      req.body.logo = logo.Key;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    const token = GenerateToken(225);
    req.body.rememberToken = { token, expiredDate: moment().add(2, "days") };
    req.body.publicToken = nanoid(50);
    req.body.tier = pricing;
    req.body.countryCode = country.cc;
    req.body.password = await bcrypt.hash(req.body.password, 10);
    const organization = new Organization(req.body);
    const company = new Company(req.body);

    company.organization = organization._id;
    organization.companyHQ = company._id;
    organization.companies = [company._id];
    // organizer.companyBranches = [];

    await company.save({ session: session });
    await organization.save({ session: session });
    await session.commitTransaction();
    session.endSession();

    const subject = "Welcome to Exalt Logistics";
    const html = template.Verification(token, req.body.email, "company");
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Create Company branch
 * @param {*} req
 * @param {*} res
 */
exports.branch = async (req, res) => {
  try {
    const { error } = validateCompany(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if an existing company  has incoming email
    const accountCheck = await Company.findOne({ email: req.body.email });
    if (accountCheck)
      return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);

    const pricing = await Pricing.findOne({ type: "freemium" });
    if (!pricing) return JsonResponse(res, 404, MSG_TYPES.FREEMIUM, null, null);

    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    // return;
    // console.log("req.files", req.files);
    if (req.files.rcDoc) {
      const rcDoc = await UploadFileFromBinary(
        req.files.rcDoc.data,
        req.files.rcDoc.name
      );
      req.body.rcDoc = rcDoc.Key;
    }
    if (req.files.logo) {
      const logo = await UploadFileFromBinary(
        req.files.logo.data,
        req.files.logo.name
      );
      req.body.logo = logo.Key;
    }

    const token = GenerateToken(225);
    req.body.rememberToken = { token, expiredDate: moment().add(2, "days") };
    req.body.createdBy = req.user.id;
    req.body.publicToken = nanoid(50);
    req.body.tier = pricing;
    req.body.countryCode = country.cc;
    await Company.create(req.body);

    const subject = "Welcome to Exalt Logistics";
    const html = template.Verification(token, req.body.email, "company");
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get me
 * @param {*} req
 * @param {*} res
 */
exports.me = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    })
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority");

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get One Company by Admin
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId })
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority");

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All Companies by Admin
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const companies = await Company.find({ deleted: false })
      .populate("vehicles")
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("tier", "name type price transactionCost priority")
      .skip(skip)
      .limit(pageSize);
    const total = await Company.find().countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All unveried Companies by Admin
 * @param {*} req
 * @param {*} res
 */
exports.allUnveried = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const companies = await Company.find({ verified: false, deleted: false })
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority")
      .skip(skip)
      .limit(pageSize);
    const total = await Company.find({ verified: false }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get Recruiting Company
 * @param {*} req
 * @param {*} res
 */
exports.recruiting = async (req, res) => {
  try {
    const settings = await Setting.find({
      recruitment: true,
      source: "company",
    });

    console.log("settings", settings);

    const companyIds = settings.map((v, i) => { return v.company });
    console.log("companyIds", companyIds);

    const companies = await Company.find({
      _id: { $in: companyIds },
      verified: true,
      deleted: false,
    })
      .select("name state country")

    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, null);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Update One Company
 * @param {*} req
 * @param {*} res
 */
exports.updateSingle = async (req, res) => {
  try {
    const { error } = validateUpdateCompany(req.body);

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    if (req.body.country) {
      const country = await Country.findOne({ name: req.body.country });
      if (!country)
        return JsonResponse(res, 404, "Country Not Found", null, null);
    }

    // validate state
    if (req.body.state) {
      const state = country.states.filter((v, i) => v.name === req.body.state);
      if (typeof state[0] === "undefined")
        return JsonResponse(res, 404, "State Not Found", null, null);
    }

    const data = req.body;

    if (req.files) {
      if (req.files.rcDoc) {
        const rcDoc = await UploadFileFromBinary(
          req.files.rcDoc.data,
          req.files.rcDoc.name
        );
        req.body.rcDoc = rcDoc.Key;
      }
      if (req.files.logo) {
        const logo = await UploadFileFromBinary(
          req.files.logo.data,
          req.files.logo.name
        );
        req.body.logo = logo.Key;
      }
    }

    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    const updatedCompany = await Company.findByIdAndUpdate(companyId, data, {
      new: true,
    });

    JsonResponse(res, 200, MSG_TYPES.UPDATED, updatedCompany, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Update Company Status
 * @param {*} req
 * @param {*} res
 */
exports.updateStatus = async (req, res) => {
  try {
    const { error } = validateStatusUpdate(req.body);
    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    const account = await Company.findOneAndUpdate(
      { _id: companyId },
      req.body
    );
    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Admin verification for company account
 * @param {*} req
 * @param {*} res
 */
exports.verification = async (req, res) => {
  try {
    const { error } = validateCompanyVerification(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const company = await Company.findOne({
      _id: req.params.companyId,
      verified: false,
    });
    if (!company)
      return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    // check if the
    if (req.body.status === "decline") {
      if (company.type === "HQ") {
        const organization = await Organization.findById(company.organization);

        await organization.deleteOne();
      }
      await company.deleteOne();

      JsonResponse(res, 200, "Account Successfully Deleted", null, null);
      return;
    }

    await company.updateOne({
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: req.user.id,
      status: "active",
    });

    if (company.type === "HQ") {
      await Organization.updateOne(
        { _id: company.organization },
        { verified: true }
      );
    }

    const subject = "Welcome! Account Approved.";
    const html = template.Verification("111", company.email, "company");
    Mailer(company.email, subject, html);

    const newSetting = new Setting({
      company: company._id,
      organization: company.organization,
      source: "company",
      weightPrice: 0,
      documentPrice: 0,
      parcelPrice: 0,
    });

    await newSetting.save();
    
    JsonResponse(res, 200, MSG_TYPES.ACCOUNT_VERIFIED, null, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Delete One Company
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findById(companyId);

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    company.deletedBy = req.user.id;
    company.deleted = true;
    company.deletedAt = Date.now();
    await company.save();
    JsonResponse(res, 200, MSG_TYPES.DELETED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
