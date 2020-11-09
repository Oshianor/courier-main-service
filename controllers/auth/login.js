const config = require("config");
const bcrypt = require("bcrypt");
const { Admin, validateAdminLogin } = require("../../models/admin");
const { Company, validateCompanyLogin } = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { User, validateLogin } = require("../../models/users");
const { Rider, validateRiderLogin } = require("../../models/rider");
// const { eventEmitter } = require("../../utils");
// const { io } = require("../../startup/socket");

/**
 * Admin Login
 * @param {*} req
 * @param {*} res
 */
exports.company = async (req, res) => {
  try {
    const { error } = validateCompanyLogin(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }

    const company = await Company.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
    })
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority");
    if (!company)
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_INVALID, null, null);

    if (company.deleted) {
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_DELETED, null, null);
    }

    if (company.status === "suspended") {
      return JsonResponse(res, 401, MSG_TYPES.SUSPENDED, null, null);
    }

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(
      req.body.password,
      company.password
    );
    if (!validPassword)
      return JsonResponse(res, 400, MSG_TYPES.ACCOUNT_INVALID, null, null);

    const token = company.generateToken();

    delete company.password;
    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, company, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Company Login
 * @param {*} req
 * @param {*} res
 */
exports.admin = async (req, res) => {
  try {
    const { error } = validateAdminLogin(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }

    const admin = await Admin.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
    });
    if (!admin)
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_INVALID, null, null);

    if (admin.deleted) {
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_DELETED, null, null);
    }

    if (admin.status === "suspended") {
      return JsonResponse(res, 401, MSG_TYPES.SUSPENDED, null, null);
    }

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(req.body.password, admin.password);
    if (!validPassword)
      return JsonResponse(res, 400, MSG_TYPES.ACCOUNT_INVALID, null, null);

    const token = admin.generateToken();

    delete admin.password;
    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, admin, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Rider Login
 * @param {*} req
 * @param {*} res
 */
exports.rider = async (req, res) => {
  try {
    const { error } = validateRiderLogin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const rider = await Rider.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
    })
      // .populate("company", "name email")
      .populate("vehicle");
    if (!rider)
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_INVALID, null, null);

    if (rider.deleted) {
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_DELETED, null, null);
    }

    if (rider.status === "suspended") {
      return JsonResponse(res, 401, MSG_TYPES.SUSPENDED, null, null);
    }

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(req.body.password, rider.password);
    if (!validPassword)
      return JsonResponse(res, 400, MSG_TYPES.ACCOUNT_INVALID, null, null);

    const token = rider.generateToken();

    delete rider.password;
    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, rider, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
