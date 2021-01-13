const Admin = require("../models/admin");
const IndustryCategory = require("../models/industryCategory");
const { validateIC } = require("../request/industryCategory");
const { MSG_TYPES } = require("../constant/types");
const { JsonResponse } = require("../lib/apiResponse");
const IndustryCategoryService = require("../services/industryCategory")


exports.create = async (req, res) => {
  try {
    // validate request
    const { error } = validateIC(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);
    
    const ICInstance = new IndustryCategoryService();
    await ICInstance.CreateCategory(req.body, req.user)

    JsonResponse(res, 200, MSG_TYPES.CREATED);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
    return;
  }
};

exports.all = async (req, res) => {
  try {
    const ic = await IndustryCategory.find()

    JsonResponse(res, 200, MSG_TYPES.FETCHED, ic);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
    return;
  }
};
