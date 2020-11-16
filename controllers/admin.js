const bcrypt = require("bcrypt");
const moment = require("moment");
const Admin = require("../models/admin");
const { validateAdmin, validatePassword } = require("../request/admin");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { Mailer, GenerateToken } = require("../utils");
const { Verification } = require("../templates");
const { Country } = require("../models/countries");
const { Rider } = require("../models/rider");
const { paginate } = require("../utils");
const user = require("../services/user");
const countryService = require("../services/country");
const adminService = require("../services/admin");
const {Container} = require("typedi");

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

    const countryInstance = Container.get(countryService);
    const adminInstance = Container.get(adminService);
    
    const country = await countryInstance.getCountryAndState(req.body.country, req.body.state);
    req.body.countryCode = country.cc;
    const admin = await adminInstance.createAdmin(req.body, req.user);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    if (!error.code) {
      JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
      return
    }
    JsonResponse(res, error.code, error.msg, null, null);
    return;
  }
};

/**
 * Get All
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res) => {
  try {
    const admins = await Admin.find({ deleted: false });

    JsonResponse(res, 200, MSG_TYPES.FETCHED, admins, null);
  } catch (err) {
    console.log(err);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get Current Authenticated Admin
 * @param {*} req
 * @param {*} res
 */
exports.current = async (req, res) => {
  try {
    const admin = await Admin.findOne({ account: req.user.id });
    JsonResponse(res, 200, null, admin, null);
  } catch (err) {
    console.log(err);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All rider for a company
 * @param {*} req
 * @param {*} res
 */
exports.allRider = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);
    
    const rider = await Rider.find({ company: req.params.company })
      .select("-password -rememberToken")
      .populate("vehicles")
      .skip(skip)
      .limit(pageSize);
    const total = await Rider.find({
      company: req.params.company,
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, rider, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get a single rider by an admin
 * @param {*} req
 * @param {*} res
 */
exports.singleRider = async (req, res) => {
  try {
    const rider = await Rider.findOne({ _id: req.params.rider })
      .select("-password -rememberToken")
      .populate("vehicles");

    JsonResponse(res, 200, MSG_TYPES.FETCHED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get all users
 * @param {*} req
 * @param {*} res
 */
exports.allUsers = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const data = await user.getAllUsers({ page, pageSize });

    JsonResponse(res, 200, MSG_TYPES.FETCHED, data.data, data.meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get single user
 * @param {*} req
 * @param {*} res
 */
exports.singleUser = async (req, res) => {
  try {
    const data = await services.user.getSingleUser(req.params.userId);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, data.data, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Delete One Admin
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const admin = await Admin.findOne({ _id: adminId });

    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    admin.deletedBy = req.user.id;
    admin.deleted = true;
    admin.deletedAt = Date.now();
    await admin.save();
    JsonResponse(res, 200, MSG_TYPES.DELETED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Update your admin details
 * @param {*} req
 * @param {*} res
 */
exports.current = async (req, res) => {
  try {
    const { error } = validateUpdateAdmin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);
    const admin = await Admin.findOne({ _id: req.user.id });
    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    await Admin.updateOne({ _id: req.user.id }, req.body);

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * change password
 * @param {*} req
 * @param {*} res
 */
exports.password = async (req, res) => {
  try {
    const { error } = validatePassword(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);
    const admin = await Admin.findOne({ _id: req.user.id });
    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    let validPassword = await bcrypt.compare(
      req.body.oldPassword,
      admin.password
    );

    if (!validPassword) {
      JsonResponse(res, 403, MSG_TYPES.INVALID_PASSWORD, null, null);
    }

    admin.password = await bcrypt.hash(req.body.password, 10);

    await admin.save();

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Disable admin account
 * @param {*} req
 * @param {*} res
 */
exports.disable = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const admin = await Admin.findOne({ _id: adminId });

    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    admin.disabled = true;
    await admin.save();
    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Enable admin account
 * @param {*} req
 * @param {*} res
 */
exports.enable = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const admin = await Admin.findOne({ _id: adminId });

    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    admin.disabled = false;
    await admin.save();
    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};