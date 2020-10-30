const { Company, validateCompany } = require("../../models/company");
const Account = require("../../services/accountService");
const { Pricing } = require("../../models/pricing");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../../constant/types");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../../utils");
const { Verification } = require("../../templates");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
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

    const countryCheck = await Account.getCountryByName(req.body.country);
    if (!countryCheck) {
      JsonResponse(res, 404, "Country Not Found", null, null);
      return;
    }

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

    //Save Data to bb
    // console.log("country", country.data);

    const token = GenerateToken(50);
    req.body.rememberToken = { token, expiredDate: moment().add(2, "days") };
    req.body.createdBy = req.user.id;
    req.body.publicToken = uuidv4();
    req.body.tier = pricing;
    // req.body.country = country.data.data.name;
    req.body.phoneNumber = req.body.contactPhoneNumber;
    req.body.type = ACCOUNT_TYPES.COMPANY;
    const account = await Account.create(req.body);
    req.body.account = account._id;
    const newCompany = await Company.create(req.body);

    // const subject = "Welcome to Exalt Logistics";
    // const html = Verification(token, req.body.email);
    // Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
