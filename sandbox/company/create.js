const { Company, validateCompany } = require("../../models/company");
const { Organization } = require("../../models/organization");
const { Pricing } = require("../../models/pricing");
const { Vehicle } = require("../../models/vehicle");
const { Country } = require("../../models/countries");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../../constant/types");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../../utils");
const { Verification } = require("../../templates");
const moment = require("moment");
const {nanoid} = require("nanoid");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

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
      return JsonResponse(res, 400, `\"email"\ or \"Phone Number"\ already exists!`, null, null);

    const pricing = await Pricing.findOne({ _id: req.body.tier });
    if (!pricing) return JsonResponse(res, 404, MSG_TYPES.FREEMIUM, null, null);

    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    
    const vehicle = await Vehicle.find({ _id: { $in: req.body.vehicles } }).countDocuments();
    if (vehicle !== req.body.vehicles.length) return JsonResponse(res, 404, "Please provide vehicles", null, null); 

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
    const company = new Company(req.body)

    company.organization = organization._id;
    organization.companyHQ = company._id;
    organization.companies = [company._id];
    // organizer.companyBranches = [];

  
    await company.save({ session: session });
    await organization.save({ session: session });
    await session.commitTransaction();
    session.endSession();
    
    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email, "company");
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
    const html = Verification(token, req.body.email, "company");
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
