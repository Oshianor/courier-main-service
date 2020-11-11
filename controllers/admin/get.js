const { Rider } = require("../../models/rider");
const { Admin } = require("../../models/admin");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const services = require("../../services");
const { paginate } = require("../../utils");

/**
 * Get Single
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
    const page =
      typeof req.query.page !== "undefined" ? Math.abs(req.query.page) : 1;
    const pageSize =
      typeof req.query.pageSize !== "undefined" ? Math.abs(req.query.page) : 50;
    const skip = (page - 1) * pageSize;

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

exports.singleUser = async (req, res) => {
  try {
    const data = await services.user.getSingleUser(req.params.userId);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, data.data, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
