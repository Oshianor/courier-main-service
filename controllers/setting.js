const { JsonResponse } = require("../lib/apiResponse");
const { Admin } = require("../models/admin");
const { DistancePrice } = require("../models/distancePrice");
const { MSG_TYPES } = require("../constant/types");
const { Company } = require("../models/company");
const { Setting, validateUpdateSettings } = require("../models/settings");

/**
 * Get settings for admin
 * @param {*} req
 * @param {*} res
 */
exports.getAdmin = async (req, res) => {
  try {
    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    const setting = await Setting.findOne({ source: "admin" });
    if (!setting)
      return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, setting, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};

/**
 * get settings for company
 * @param {*} req
 * @param {*} res
 */
exports.getCompany = async (req, res) => {
  try {
    // check if account exist
    const company = await Company.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
    });
    if (!company)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    const setting = await Setting.findOne({
      company: company._id,
      source: "company",
      organization: company.organization,
    });
    if (!setting)
      return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, setting, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};

/**
 * Update settings for admin
 * @param {*} req
 * @param {*} res
 */
exports.updateAdmin = async (req, res) => {
  try {
    // validate request
    const { error } = validateUpdateSettings(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

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

/**
 * Update settings for company
 * @param {*} req
 * @param {*} res
 */
exports.updateCompany = async (req, res) => {
  try {
    // validate request
    const { error } = validateUpdateSettings(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const company = await Company.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
    });
    if (!company)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const setting = await Setting.findOne({
      source: "company",
      company: company._id,
    });
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
