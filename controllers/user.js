const moment = require("moment");
const User = require("../models/users");
const UserService = require("../services/user");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { validateRiderFCMToken } = require("../request/rider");
const { paginate } = require("../utils");

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

/**
 * Get user pending/request orders
 * @param {*} req 
 * @param {*} res 
 */
exports.pending = async (req, res) => {
  try {
    const userInstance = new UserService();
    const orders = await userInstance.getUserPendingOrder(req.user);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders);
    return 
  } catch (error) {
    JsonResponse(res, error.code, error.msg);
    return
  }
}


/**
 * Get rider completed order for the day
 * @param {*} req 
 * @param {*} res 
 */
exports.completed = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);
    const userInstance = new UserService();
    const {order, total} = await userInstance.getUserDeliveredOrder(
      req.user,
      skip,
      pageSize
    );

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, order, meta);
    return 
  } catch (error) {
    JsonResponse(res, error.code, error.msg);
    return
  }
}
