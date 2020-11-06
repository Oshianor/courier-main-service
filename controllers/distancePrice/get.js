const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { DistancePrice } = require("../../models/distancePrice");
const { MSG_TYPES } = require("../../constant/types");

exports.all = async (req, res) => {
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
      
    const dp = await DistancePrice.find().skip(skip).limit(pageSize);
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
