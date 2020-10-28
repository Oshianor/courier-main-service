const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { Pricing, validatePricing } = require("../../models/pricing");
const { MSG_TYPES } = require("../../constant/types");

exports.all = async (req, res) => {
  try {
    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    const pricing = await Pricing.find();

    JsonResponse(res, 200, MSG_TYPES.FETCHED, pricing, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
