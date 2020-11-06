const config = require("config");
const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { Company } = require("../../models/company");
const { Setting, validateUpdateSettings } = require("../../models/settings");
const { MSG_TYPES } = require("../../constant/types");

exports.admin = async (req, res) => {
  try {
    // validate request
    const { error } = validateUpdateSettings(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin) return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const setting = await Setting.findOne({ source: "admin" });
    if (!setting) {
      req.body.source = "admin";
      const newSetting = new Setting(req.body);
      await newSetting.save();
    } else {
      await setting.updateOne(req.body);
    }

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};



exports.company = async (req, res) => {
  try {
    // validate request
    const { error } = validateUpdateSettings(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const company = await Company.findOne({ _id: req.user.id, status: "active", verified: true });
    if (!company) return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const setting = await Setting.findOne({ source: "company", company: company._id });
     if (!setting) {
       req.body.source = "company";
       req.body.company = company._id;
       req.body.organization = company.organization;
       const newSetting = new Setting(req.body);
       await newSetting.save();
     } else {
       await setting.updateOne(req.body);
     }

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};