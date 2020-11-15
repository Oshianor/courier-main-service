const config = require("config");
const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { Pricing, validateUpdatePricing } = require("../../models/pricing");
const { MSG_TYPES } = require("../../constant/types");

exports.pricing = async (req, res) => {
  try {
    // validate request
    const { error } = validateUpdatePricing(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const pricing = await Pricing.findById(req.params.pricingId);
    if (!pricing)
      return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    await pricing.updateOne(req.body);

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
