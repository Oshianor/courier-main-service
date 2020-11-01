const { Company, validateCompany } = require("../../models/company");
const { Pricing } = require("../../models/pricing");
const { Country } = require("../../models/countries");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../../constant/types");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../../utils");
const { Verification } = require("../../templates");
const moment = require("moment");
const nanoid = require("nanoid");
const { to } = require("await-to-js");
const axios = require("axios");
const config = require("config");

/**
 * Create Company
 * @param {*} req
 * @param {*} res
 */
exports.company = async (req, res) => {
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
    if (!country) return JsonResponse(res, 404, "Country Not Found", null, null);

      // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined") return JsonResponse(res, 404, "State Not Found", null, null);


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
