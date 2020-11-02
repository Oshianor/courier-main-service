const { Company } = require("../../models/company");
const { Rider } = require("../../models/rider");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");


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
      companyRequest: "approved",
    })
      .populate("vehicle")
      .select("-password");
    if (!rider) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    const company = await Company.findOne({
      _id: rider.company,
      verified: true,
      status: "active",
    })
    if (!company) return JsonResponse(res, 404, "Company Not Found!", null, null);

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
  
    const company = await Company.findOne({ account: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }
    const riderId = req.params.riderId;
    const rider = await Rider.findOne({ _id: riderId });

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
 * Get All Riders
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res) => {
  try {

    const company = await Company.findOne({ account: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const riders = await Rider.find({ company: company.id });

    JsonResponse(res, 200, null, riders, null);
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
    const page = typeof req.query.page !== "undefined" ? Math.abs(req.query.page) : 1;
    const pageSize = typeof req.query.pageSize !== "undefined" ? Math.abs(req.query.page) : 50;
    const skip = (page - 1) * pageSize;

    const riders = await Rider.find().skip(skip).limit(pageSize).select("-password");
    const total = await Rider.find().countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, riders, meta);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

// b-suite 1/2 rauf aregbesola shoping complex pako bus