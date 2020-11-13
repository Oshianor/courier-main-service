const { Company } = require("../../models/company");
const { Rider } = require("../../models/rider");
const { Entry } = require("../../models/entry");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { RiderCompanyRequest } = require("../../models/riderCompanyRequest");
const { paginate } = require("../../utils");

/**
 * Get Me
 * @param {*} req
 * @param {*} res
 */
exports.me = async (req, res) => {
  try {
    const rider = await Rider.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    })
      .populate("vehicle")
      .select("-password");
    if (!rider) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    if (!rider.company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    const company = await Company.findOne({
      _id: rider.company,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get One Rider
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }
    const riderId = req.params.riderId;
    const rider = await Rider.findOne({ _id: riderId })
      .populate("company")
      .select("-password");

    if (!rider) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, null, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All Riders by a company
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const company = await Company.findOne({ _id: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const riders = await Rider.find({ company: company.id, deleted: false })
      .skip(skip)
      .limit(pageSize)
      .populate("company", "name address state country logo")
      .select("-password -rememberToken");
    const total = await Rider.find({
      company: company.id,
      deleted: false,
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, riders, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All Riders by Admin
 * @param {*} req
 * @param {*} res
 */
exports.allByAdmin = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const riders = await Rider.find()
      .skip(skip)
      .limit(pageSize)
      .populate("company", "name address state country logo")
      .select("-password -rememberToken");
    const total = await Rider.find().countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, riders, meta);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All Riders Request
 * @param {*} req
 * @param {*} res
 */
exports.requests = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const riders = await RiderCompanyRequest.find({
      status: "pending",
      company: req.user.id,
    })
      .populate("rider", "name email address state country img onlineStatus")
      .populate("company", "name email address state country logo")
      .skip(skip)
      .limit(pageSize)
      .select("-password");
    const total = await Rider.find({
      companyRequest: "pending",
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, riders, meta);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
