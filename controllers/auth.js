const config = require("config");
const objectPath = require("object-path");
const bcrypt = require("bcrypt");
const Company = require("../models/company");
const Rider = require("../models/rider");
const Admin = require("../models/admin");
const { validateAdminLogin, validateVerifyAccount } = require("../request/admin");
const { validateCompanyLogin, validateVerifyCompany } = require("../request/company");
const { validateRiderLogin } = require("../request/rider");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");

/**
 * Company Login
 * @param {*} req
 * @param {*} res
 */
exports.companyLogin = async (req, res) => {
  try {
    const { error } = validateCompanyLogin(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message);
    }

    const company = await Company.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
    })
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority");
    if (!company)
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_INVALID);

    if (company.deleted) {
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_DELETED);
    }

    if (company.status === "suspended") {
      return JsonResponse(res, 401, MSG_TYPES.SUSPENDED);
    }

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(
      req.body.password,
      company.password
    );
    if (!validPassword)
      return JsonResponse(res, 400, MSG_TYPES.ACCOUNT_INVALID);

    const token = company.generateToken();
    
    company.password = "";
    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, company, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
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
      return JsonResponse(res, 400, error.details[0].message);
    }

    const admin = await Admin.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
      status: "active"
    });
    if (!admin)
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_INVALID);

    if (admin.deleted) {
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_DELETED);
    }

    if (admin.status === "suspended") {
      return JsonResponse(res, 401, MSG_TYPES.SUSPENDED);
    }

    // if (admin.disabled) {
    //   return JsonResponse(res, 401, MSG_TYPES.DISABLED);
    // }

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(req.body.password, admin.password);
    if (!validPassword)
      return JsonResponse(res, 400, MSG_TYPES.ACCOUNT_INVALID);

    const token = admin.generateToken();

    admin.password = "";
    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, admin, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
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
      return JsonResponse(res, 400, error.details[0].message);

    const rider = await Rider.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
    })
      // .populate("company", "name email")
      .populate("vehicle");
    if (!rider)
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_INVALID);

    if (rider.deleted) {
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_DELETED);
    }

    if (rider.status === "suspended") {
      return JsonResponse(res, 401, MSG_TYPES.SUSPENDED);
    }

    if (!rider.company) {
      return JsonResponse(res, 400, "You can't login because you've not been assigned to a company");
    }

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(req.body.password, rider.password);
    if (!validPassword)
      return JsonResponse(res, 400, MSG_TYPES.ACCOUNT_INVALID);

    const token = rider.generateToken();

    rider.password = "";
    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, rider, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
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
      return JsonResponse(res, 400, error.details[0].message);

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
        return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      await admin.updateOne(dataUpdate);
    } else if (req.body.type === "rider") {
      const rider = await Rider.findOne(dataReq);
      if (!rider)
        return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      await rider.updateOne(dataUpdate);
    }

    JsonResponse(res, null, MSG_TYPES.ACCOUNT_VERIFIED);
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Verify company accounts
 * @param {*} req
 * @param {*} res
 */
exports.companyVerify = async (req, res) => {
  try {
    const { error } = validateVerifyCompany(req.query);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const currentDate = new Date();
    const company = await Company.findOne({
      email: req.query.email,
      "rememberToken.token": req.query.token,
      verified: false,
      emailVerified: false,
      "rememberToken.expiredDate": { $gte: currentDate },
    });
    if (!company)
      return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    await company.updateOne({
      emailVerified: true,
      rememberToken: null,
      status: "inactive",
    });

    // JsonResponse(res, null, MSG_TYPES.AWAIT_ADMIN);
    return res.send(MSG_TYPES.AWAIT_ADMIN);
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};
