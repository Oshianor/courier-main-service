const config = require("config");
const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { DistancePrice, validateUpdateDistancePrice } = require("../../models/distancePrice");
const { MSG_TYPES } = require("../../constant/types");

exports.dp = async (req, res) => {
  try {
    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin) return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const dp = await DistancePrice.findById(req.params.dp);
    if (!dp) return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    await dp.deleteOne();

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
