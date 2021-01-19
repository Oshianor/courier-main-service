const bcrypt = require("bcrypt");
const AdminModel = require("../models/admin");
const user = require("../services/user");
const UserService = require("../services/user");
const CountryService = require("../services/country");
const RiderModel = require("../models/rider");
const AdminService = require("../services/admin");
const {
  validateAdmin,
  validatePassword,
  validateUpdateAdmin,
  validateGetEnterpriseAccounts
} = require("../request/admin");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");
const { Container } = require("typedi");
const EnterpriseService = require("../services/enterprise");
const adminInstance = Container.get(AdminService);
const userInstance = Container.get(UserService);
const countryInstance = Container.get(CountryService);
const enterpriseInstance = Container.get(EnterpriseService)

/**
 * Create AdminModel
 * @param {*} req
 * @param {*} res
 */
exports.createAdmin = async (req, res) => {
  try {
    const { error } = validateAdmin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const country = await countryInstance.getCountryAndState(
      req.body.country,
      req.body.state
    );
    req.body.countryCode = country.cc;
    await adminInstance.createAdmin(req.body, req.user);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, error.code, error.msg);
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
    const admin = await adminInstance.getAll({ deleted: false });

    JsonResponse(res, 200, MSG_TYPES.FETCHED, admin, null);
    return;
  } catch (err) {
    JsonResponse(res, err.code, err.msg);
    return;
  }
};

/**
 * Get Current Authenticated AdminModel
 * @param {*} req
 * @param {*} res
 */
exports.me = async (req, res) => {
  try {
    const admin = await adminInstance.get({ _id: req.user.id });

    JsonResponse(res, 200, MSG_TYPES.FETCHED, admin, null);
  } catch (err) {
    console.log(err);
    JsonResponse(res, err.code, err.msg);
    return;
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

    const { rider, total } = await adminInstance.getAllRider(
      req.params.company,
      skip,
      pageSize
    );
    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, rider, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Get a single rider by an admin
 * @param {*} req
 * @param {*} res
 */
exports.singleRider = async (req, res) => {
  try {
    const rider = await RiderModel.findOne({ _id: req.params.rider })
      .select("-password -rememberToken")
      .populate("vehicles");

    JsonResponse(res, 200, MSG_TYPES.FETCHED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
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

    const data = await userInstance.getAllUsers({ page, pageSize });

    JsonResponse(res, 200, MSG_TYPES.FETCHED, data.data, data.meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Get single user
 * @param {*} req
 * @param {*} res
 */
exports.singleUser = async (req, res) => {
  try {
    const data = await userInstance.getByID(req.params.userId);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, data.data, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Delete One AdminModel
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const admin = await adminInstance.get({ _id: req.params.adminId });

    admin.deletedBy = req.user.id;
    admin.deleted = true;
    admin.deletedAt = Date.now();
    await admin.save();
    JsonResponse(res, 200, MSG_TYPES.DELETED);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Update your admin details
 * @param {*} req
 * @param {*} res
 */
exports.updateMe = async (req, res) => {
  try {
    const { error } = validateUpdateAdmin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const admin = await adminInstance.get({ _id: req.user.id });

    await admin.updateOne(req.body);

    JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
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
      return JsonResponse(res, 400, error.details[0].message);

    await adminInstance.changePassword(req.body, req.user)

    JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    console.log(error);
    JsonResponse(res, error.code, error.msg);
    return
  }
};

/**
 * Disable admin account
 * @param {*} req
 * @param {*} res
 */
exports.disable = async (req, res) => {
  try {
    const admin = await adminInstance.get({ _id: req.params.adminId });

    admin.status = "suspended";
    await admin.save();
    JsonResponse(res, 200, MSG_TYPES.UPDATED);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, error.code, error.msg);
    return
  }
};

/**
 * Enable admin account
 * @param {*} req
 * @param {*} res
 */
exports.enable = async (req, res) => {
  try {
    const admin = await adminInstance.get({ _id: req.params.adminId });

    admin.status = "active";
    await admin.save();
    JsonResponse(res, 200, MSG_TYPES.UPDATED);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, error.code, error.msg);
    return
  }
};

/**
 * Verify an enterprise branch
 * @param {*} req
 * @param {*} res
 */
exports.verifyBranch = async (req, res, next) => {
  try {
    await adminInstance.verifyBranch(req.params.branchId);
    JsonResponse(res, 200, MSG_TYPES.UPDATED);
    return
  } catch (error) {
    console.log(error);
    next(error)
    return
  }
};


/**
 * Get Enterprise Accounts
 * @param {*} req
 * @param {*} res
 */
exports.getEnterpriseAccounts = async (req, res, next) => {
  try {
    const { error } = validateGetEnterpriseAccounts(req.query);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const { page, pageSize, skip } = paginate(req);

    const { enterpriseAccounts, total } = await enterpriseInstance.getEnterpriseAccounts(req.query.role, skip, pageSize);

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    return JsonResponse(res, 200, MSG_TYPES.FETCHED, enterpriseAccounts, meta);
  } catch (error) {
    next(error);
  }
}