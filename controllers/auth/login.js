const Joi = require("joi");
const { Admin, validateAdminLogin } = require("../../models/admin");
const { Company, validateCompanyLogin } = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { User, validateLogin } = require("../../models/users");
const config = require("config");
const bcrypt = require("bcrypt");
const { Account } = require("../../models/account");
const { Rider } = require("../../models/rider");

exports.loginAsUser = async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // find the user trying to login
    const user = await User.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
    });
    if (!user) return JsonResponse(res, 400, "ACCOUNT_INVALID", null, null);

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword)
      return JsonResponse(res, 400, "ACCOUNT_INVALID", null, null);

    let token = user.generateToken();

    res.header("x-auth-token", token);
    JsonResponse(res, null, "LOGGED_IN", null, null);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};

/**
 * Admin Login
 * @param {*} req
 * @param {*} res
 */
exports.adminLogin = async (req, res) => {
  try {
    const { error } = validateAdminLogin(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }

    const account = await Account.findOne({ email: req.body.email });
    if (!account) {
      return JsonResponse(res, 401, "Invalid Credentials!", null, null);
    }
    if (!account.isValidPassword(req.body.password)) {
      return JsonResponse(res, 401, "Invalid Credentials!", null, null);
    }

    if (account.status !== "active") {
      return JsonResponse(res, 401, account.status.toUpperCase(), null, null);
    }
    let token = account.generateToken();

    const admin = await Admin.findOne({ account: account._id });

    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, admin, null);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};

/**
 * Company Login
 * @param {*} req
 * @param {*} res
 */
exports.companyLogin = async (req, res) => {
  try {
    const { error } = validateCompanyLogin(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }

    const account = await Account.findOne({ email: req.body.email });

    if (!account) {
      return JsonResponse(res, 401, "Invalid Credentials!", null, null);
    }
    if (!account.isValidPassword(req.body.password)) {
      return JsonResponse(res, 401, "Invalid Credentials!", null, null);
    }

    if (account.status !== "active") {
      return JsonResponse(res, 401, account.status.toUpperCase(), null, null);
    }
    let token = account.generateToken();

    const company = await Company.findOne({ account: account._id });

    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, company, null);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};

/**
 * Rider Login
 * @param {*} req
 * @param {*} res
 */
exports.riderLogin = async (req, res) => {
  try {
    const { error } = validateCompanyLogin(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }

    const account = await Account.findOne({
      email: req.body.email,
      status: "active",
    });

    if (!account) {
      return JsonResponse(res, 401, "Invalid Credentials!", null, null);
    }
    if (!account.isValidPassword(req.body.password)) {
      return JsonResponse(res, 401, "Invalid Credentials!", null, null);
    }

    if (account.status !== "active") {
      return JsonResponse(res, 401, account.status.toUpperCase(), null, null);
    }
    let token = account.generateToken();

    const company = await Rider.findOne({ account: account._id });

    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, company, null);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};
