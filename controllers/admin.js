const bcrypt = require("bcrypt");
const moment = require("moment");
const { Admin, validateAdmin, validatePassword } = require("../models/admin");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { Mailer, GenerateToken } = require("../utils");
const { Verification } = require("../templates");
const { Country } = require("../models/countries");
const { Rider } = require("../models/rider");
const { paginate } = require("../utils");
const services = require("../services");

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
    const adminCheck = await Admin.findOne({
      $or: [{ email: req.body.email }, { phoneNumber: req.body.phoneNumber }],
    });
    if (adminCheck) {
      JsonResponse(res, 400, `\"email or phoneNumber "\ already exists!`);
      return;
    }

    // validate country
    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    const token = GenerateToken(225);
    req.body.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };
    req.body.countryCode = country.cc;
    req.body.createdBy = req.user.id;
    await Admin.create(req.body);

    const subject = "Welcome to Exalt Logistics Admin";
    const html = Verification(token, req.body.email, "admin");
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
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

    const data = await services.user.getAllUsers({ page, pageSize });

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