const OrderService = require("../services/order");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");



/**
 * Revenue
 * @param {*} req
 * @param {*} res
 */
exports.revenue = async (req, res, next) => {
  try {
    const orderInstance = new OrderService();
    const orderStats = await orderInstance.revenue();
    JsonResponse(res, 200, MSG_TYPES.FETCHED, orderStats);
    return
  } catch (error) {
    next(error)
    return
  }
};