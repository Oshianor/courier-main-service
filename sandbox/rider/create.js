const Joi = require("joi");
const { Company } = require("../../models/company");
const {
  Rider,
  validateRider,
  validateRiderSelf,
} = require("../../models/rider");
const { RiderCompanyRequest } = require("../../models/riderCompanyRequest");
const { Country } = require("../../models/countries");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../../constant/types");
const { Verification } = require("../../templates");
const {
  UploadFileFromBinary,
  Mailer,
  GenerateToken,
  GenerateOTP,
} = require("../../utils");
const moment = require("moment");
const bcrypt = require("bcrypt");
const service = require("../../services");
const SendOTPCode = require("../../templates/otpCode");

/**
 * Create Rider
 * @param {*} req
 * @param {*} res
 */
exports.create = async (req, res) => {
  try {
    const { error } = validateRider(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const company = await Company.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    const rider = await Rider.findOne({ email: req.body.email });
    if (rider)
      return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);

    const phoneCheck = await Rider.findOne({
      phoneNumber: req.body.phoneNumber,
    });
    if (phoneCheck) {
      JsonResponse(res, 400, `\"phoneNumber"\ already exists!`, null, null);
      return;
    }

    // validate country
    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    if (req.files.POI) {
      const POI = await UploadFileFromBinary(
        req.files.POI.data,
        req.files.POI.name
      );
      req.body.POI = POI.Key;
    }

    if (req.files.img) {
      const img = await UploadFileFromBinary(
        req.files.img.data,
        req.files.img.name
      );
      req.body.img = img.Key;
    }

    const token = GenerateToken(225);
    req.body.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };

    req.body.company = req.user.id;
    req.body.countryCode = country.cc; // add country code.
    req.body.createdBy = "company";
    // req.body.verificationType = "email";
    req.body.companyRequest = "approved";
    await Rider.create(req.body);

    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email, "rider");
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Create Rider (Self)
 * @param {*} req
 * @param {*} res
 */
exports.createSelf = async (req, res) => {
  try {
    const { error } = validateRiderSelf(req.body);

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    const company = await Company.findOne({
      _id: req.body.company,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    const rider = await Rider.findOne({ email: req.body.email });
    if (rider)
      return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);

    const phoneCheck = await Rider.findOne({
      phoneNumber: req.body.phoneNumber,
    });
    if (phoneCheck) {
      JsonResponse(res, 400, `\"phoneNumber"\ already exists!`, null, null);
      return;
    }

    // validate country
    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    if (req.files.POI) {
      const POI = await UploadFileFromBinary(
        req.files.POI.data,
        req.files.POI.name
      );
      req.body.POI = POI.Key;
    }

    if (req.files.img) {
      const img = await UploadFileFromBinary(
        req.files.img.data,
        req.files.img.name
      );
      req.body.img = img.Key;
    }

    const token = GenerateToken(225);
    req.body.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };

    // const password = await bcrypt.hash(req.body.password, 10);
    // req.body.password = password;
    req.body.countryCode = country.cc; // add country code.
    req.body.createdBy = "self";
    req.body.company = null;
    const newRider = new Rider(req.body);

    const request = new RiderCompanyRequest({
      company: company.id,
      rider: newRider._id,
      status: "pending",
    });
    await request.save();
    await newRider.save();

    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email, "rider");
    Mailer(req.body.email, subject, html);
    newRider.rememberToken = null;
    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, newRider, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
