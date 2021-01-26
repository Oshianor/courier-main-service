const Admin = require("../models/admin");
const IndustryCategory = require("../models/industryCategory");
const { validateIC } = require("../request/industryCategory");
const { MSG_TYPES } = require("../constant/types");
const { JsonResponse } = require("../lib/apiResponse");
const IndustryCategoryService = require("../services/industryCategory")


exports.create = async (req, res, next) => {
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
        next(error);

  }
};

exports.all = async (req, res, next) => {
  try {
    const ic = await IndustryCategory.find()

    JsonResponse(res, 200, MSG_TYPES.FETCHED, ic);
    return;
  } catch (error) {
        next(error);

  }
};
