const config = require("config");
const objectPath = require("object-path");
const bcrypt = require("bcrypt");
const { Admin, validateAdminLogin } = require("../models/admin");
const { Company, validateCompanyLogin } = require("../models/company");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { Rider, validateRiderLogin } = require("../models/rider");

/**
 * Admin Login
 * @param {*} req
 * @param {*} res
 */
exports.companyLogin = async (req, res) => {
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

    console.log("company", company);
    
    objectPath.empty(company, "password");
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
exports.adminLogin = async (req, res) => {
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

    if (admin.disabled) {
      return JsonResponse(res, 401, MSG_TYPES.DISABLED, null, null);
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
exports.riderLogin = async (req, res) => {
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

/**
 * Verify rider and admin account
 * @param {*} req
 * @param {*} res
 */
exports.accountVerify = async (req, res) => {
  try {
    const { error } = validateVerifyAccount(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const currentDate = new Date();
    const password = await bcrypt.hash(req.body.password, 10);

    const dataReq = {
      email: req.body.email,
      "rememberToken.token": req.body.token,
      verified: false,
      emailVerified: false,
      "rememberToken.expiredDate": { $gte: currentDate },
    };

    const dataUpdate = {
      verified: true,
      emailVerified: true,
      rememberToken: null,
      password,
      status: "active",
    };

    if (req.body.type === "admin") {
      const admin = await Admin.findOne(dataReq);
      if (!admin)
        return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      await admin.updateOne(dataUpdate);
    } else if (req.body.type === "rider") {
      const rider = await Rider.findOne(dataReq);
      if (!rider)
        return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      await rider.updateOne(dataUpdate);
    }

    JsonResponse(res, null, MSG_TYPES.ACCOUNT_VERIFIED, null, null);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
};

/**
 * Verify company accounts
 * @param {*} req
 * @param {*} res
 */
exports.companyVerify = async (req, res) => {
  try {
    const { error } = validateVerifyCompany(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const currentDate = new Date();
    const company = await Company.findOne({
      email: req.body.email,
      "rememberToken.token": req.body.token,
      verified: false,
      emailVerified: false,
      "rememberToken.expiredDate": { $gte: currentDate },
    });
    if (!company)
      return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    await company.updateOne({
      emailVerified: true,
      rememberToken: null,
      status: "inactive",
    });

    JsonResponse(res, null, MSG_TYPES.AWAIT_ADMIN);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
};
