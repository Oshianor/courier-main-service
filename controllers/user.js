const moment = require("moment");
const User = require("../models/users");
const UserService = require("../services/user");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { validateRiderFCMToken } = require("../request/rider");

/**
 * Create Rider
 * @param {*} req
 * @param {*} res
 */
exports.FCMToken = async (req, res) => {
  try {
    const { error } = validateRiderFCMToken(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const userInstance = new UserService();
    await userInstance.updateFCMToken(req.body, req.user);

    JsonResponse(res, 200, MSG_TYPES.FCMToken);
  } catch (error) {
    console.log(error);
    JsonResponse(res, error.code, error.msg);
  }
};
