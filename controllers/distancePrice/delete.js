const config = require("config");
const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { DistancePrice, validateUpdateDistancePrice } = require("../../models/distancePrice");
const { MSG_TYPES } = require("../../constant/types");
const { Company } = require("../../models/company");


exports.admin = async (req, res) => {
  try {
    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin) return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const dp = await DistancePrice.findOne({ _id: req.params.dp, source: "admin"});
    if (!dp) return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    await dp.deleteOne();

    JsonResponse(res, 200, MSG_TYPES.DELETED, null, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};

exports.company = async (req, res) => {
  try {
    // check if account exist
    const company = await Company.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
      deleted: false,
    });
    if (!company)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const dp = await DistancePrice.findOne({ _id: req.params.dp, company: req.user.id, source: "company" });
    if (!dp) return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    await dp.deleteOne();

    JsonResponse(res, 200, MSG_TYPES.DELETED, null, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
