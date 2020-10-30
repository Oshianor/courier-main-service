const Joi = require("joi");
const {
  Admin,
  validateAdmin,
  validateAdminSuper,
} = require("../../models/admin");
const Account = require("../../services/accountService");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../../constant/types");
const { to } = require("await-to-js");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../../utils");
const { Verification } = require("../../templates");
const moment = require("moment");

/**
 * Create Admin
 * @param {*} req
 * @param {*} res
 */
exports.createAdmin = async (req, res) => {
  try {
    const { error } = validateAdmin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if an existing admin has incoming email
    const adminCheck = await Admin.findOne({ email: req.body.email });
    if (adminCheck) {
      JsonResponse(res, 400, `\"email"\ already exists!`, null, null);
      return;
    }

    const countryCheck = await Account.getCountryByName(req.body.country);

    if (!countryCheck) {
      JsonResponse(res, 404, "Country Not Found", null, null);
      return;
    }

    console.log(countryCheck);

    const token = GenerateToken(50);
    req.body.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };
    req.body.createdBy = req.user.id;
    req.body.type = ACCOUNT_TYPES.ADMIN;
    const account = await Account.create(req.body);
    req.body.account = account._id;
    const admin = await Admin.create(req.body);

    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email);
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};

/**
 * Create Super
 * @param {*} req
 * @param {*} res
 */
exports.createAdminSuper = async (req, res) => {
  try {
    const { error } = validateAdminSuper(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if an existing admin has incoming email
    const adminCheck = await Account.findOne({ email: req.body.email });
    if (adminCheck) {
      console.log(adminCheck);
      JsonResponse(res, 400, `\"email"\ already exists!`, null, null);
      return;
    }

    let err, admin;
    req.body.type = ACCOUNT_TYPES.ADMIN;
    const account = await Account.create(req.body);
    // req.body.createdBy = req.user.id;
    req.body.account = account._id;
    [err, admin] = await to(Admin.create(req.body));
    if (err) {
      //on admin failure remove account
      await Account.deleteOne({ email: req.body.email });
      throw err;
    }
    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};
