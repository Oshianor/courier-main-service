const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { DistancePrice } = require("../../models/distancePrice");
const { MSG_TYPES } = require("../../constant/types");
const { Company } = require("../../models/company");


exports.admin = async (req, res) => {
  try {
    const page =
      typeof req.query.page !== "undefined" ? Math.abs(req.query.page) : 1;
    const pageSize =
      typeof req.query.pageSize !== "undefined" ? Math.abs(req.query.page) : 50;
    const skip = (page - 1) * pageSize;
    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    const dp = await DistancePrice.find()
      .populate("vehicle")
      .skip(skip)
      .limit(pageSize);
    const total = await DistancePrice.find().countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, dp, meta);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};

exports.company = async (req, res) => {
  try {
    const page =
      typeof req.query.page !== "undefined" ? Math.abs(req.query.page) : 1;
    const pageSize =
      typeof req.query.pageSize !== "undefined" ? Math.abs(req.query.page) : 50;
    const skip = (page - 1) * pageSize;
    // check if account exist

    const company = await Company.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
      deleted: false,
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found", null, null);

    const dp = await DistancePrice.find({
      source: "company",
      company: req.user.id,
    })
      .populate("vehicle")
      .skip(skip)
      .limit(pageSize);
    const total = await DistancePrice.find({
      source: "company",
      company: req.user.id,
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, dp, meta);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
