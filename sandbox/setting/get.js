const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { DistancePrice } = require("../../models/distancePrice");
const { MSG_TYPES } = require("../../constant/types");
const { Company } = require("../../models/company");
const { Setting } = require("../../models/settings");


exports.admin = async (req, res) => {
  try {
    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);
      
    const setting = await Setting.findOne({ source: "admin" });
    if (!setting) return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);


    JsonResponse(res, 200, MSG_TYPES.FETCHED, setting, null);
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
    const company = await Company.findOne({ _id: req.user.id, status: "active", verified: true });
    if (!company) return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    const setting = await Setting.findOne({ company: company._id, source: "company", organization: company.organization });
    if (!setting) return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, setting, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
