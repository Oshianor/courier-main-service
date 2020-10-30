const Joi = require("joi");
const { Company } = require("../../models/company");
const Account = require("../../services/accountService");
const {
  Rider,
  validateRider,
  validateRiderSelf,
} = require("../../models/rider");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../../constant/types");
const { Verification } = require("../../templates");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../../utils");
const moment = require("moment");
const { to } = require("await-to-js");
/**
 * Create Rider
 * @param {*} req
 * @param {*} res
 */
exports.create = async (req, res) => {
  try {
    const { error } = validateRider(req.body);

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    if (req.body.email) {
      // check if an existing rider has incoming email
      const accountCheck = await Rider.findOne({ email: req.body.email });

      if (accountCheck) {
        JsonResponse(res, 400, `\"email"\ already exists!`, null, null);
        return;
      }
    }
    const company = await Company.findOne({ account: req.user.id });

    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const countryCheck = await Account.getCountryByName(req.body.country);
    if (!countryCheck) {
      JsonResponse(res, 404, "Country Not Found", null, null);
      return;
    }

    const data = req.body;
    data.company = company._id;

    if (req.files.proofOfIdentity) {
      const proofOfIdentity = await UploadFileFromBinary(
        req.files.proofOfIdentity.data,
        req.files.proofOfIdentity.name
      );
      data.proofOfIdentity = proofOfIdentity.Key;
    }

    if (req.files.image) {
      const image = await UploadFileFromBinary(
        req.files.image.data,
        req.files.image.name
      );
      data.image = image.Key;
    }

    const token = GenerateToken(50);
    data.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };

    req.body.type = ACCOUNT_TYPES.RIDER;
    const account = await Account.create(data);
    req.body.account = account._id;
    const rider = await Rider.create(data);

    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email);
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

    if (req.body.email) {
      // check if an existing rider has incoming email
      const accountCheck = await Account.findOne({ email: req.body.email });

      if (accountCheck) {
        JsonResponse(res, 400, `\"email"\ already exists!`, null, null);
        return;
      }
    }
    const data = req.body;
    let company;
    if (req.query.companyId) {
      company = await Company.findOne({ account: req.query.companyId });

      if (!company) {
        JsonResponse(res, 404, "Company Not Found!", null, null);
        return;
      }
      data.company = company._id;
    }

    if (req.files.proofOfIdentity) {
      const proofOfIdentity = await UploadFileFromBinary(
        req.files.proofOfIdentity.data,
        req.files.proofOfIdentity.name
      );
      data.proofOfIdentity = proofOfIdentity.Key;
    }

    if (req.files.image) {
      const image = await UploadFileFromBinary(
        req.files.image.data,
        req.files.image.name
      );
      data.image = image.Key;
    }

    const token = GenerateToken(50);
    data.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };

    req.body.type = ACCOUNT_TYPES.RIDER;
    const account = await Account.create(data);
    req.body.account = account._id;
    const [err, rider] = await to(Rider.create(data));
    if (err) {
      //on admin failure remove account
      await Account.deleteOne({ email: req.body.email });
      throw err;
    }
    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email);
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
