const moment = require("moment");
const User = require("../models/users");
const UserService = require("../services/user");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { validateRiderFCMToken } = require("../request/rider");
const { paginate } = require("../utils");





/**
 * Create a user
 * @param {*} req
 * @param {*} res
 */
exports.createUser = async (req, res, next) => {
  try {
    const userInstance = new UserService();
    const { user } = await userInstance.createUser(req.body);

    user.password = "";
    JsonResponse(res, 200, MSG_TYPES.ACCOUNT_CREATED, user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user FCM Token
 * @param {*} req
 * @param {*} res
 */
exports.FCMToken = async (req, res, next) => {
  try {
    const { error } = validateRiderFCMToken(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const userInstance = new UserService();
    await userInstance.updateFCMToken(req.body, req.user);

    JsonResponse(res, 200, MSG_TYPES.FCMToken);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user pending/request orders
 * @param {*} req
 * @param {*} res
 */
exports.pending = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const userInstance = new UserService();
    const { orders, total } = await userInstance.getUserPendingOrder(
      req.user,
      skip,
      pageSize
    );

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders, meta);
    return
  } catch (error) {
    next(error);
  }
}

/**
 * Get rider completed order for the day
 * @param {*} req
 * @param {*} res
 */
exports.completed = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);
    const userInstance = new UserService();
    const { orders, total } = await userInstance.getUserDeliveredOrder(
      req.user,
      skip,
      pageSize
    );

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders, meta);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Update user account details
 * @param {*} req
 * @param {*} res
 */
exports.updateUserAccount = async (req, res, next) => {
  try {
    const userService = new UserService();
    await userService.updateAccount(req.params.userId, req.body);

    return JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    next(error);
  }
}