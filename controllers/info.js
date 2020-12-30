const OrderService = require("../services/order");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");

const orderInstance = new OrderService();



// INFO-METRICS 

/**
 * Get order statistics
 * @param {*} req
 * @param {*} res
 */
exports.orderStatistics = async (req, res, next) => {
  try {
    const orderStats = await orderInstance.orderStats();
    JsonResponse(res, 200, MSG_TYPES.FETCHED, orderStats);
    return
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Revenue
 * @param {*} req
 * @param {*} res
 */
exports.revenue = async (req, res, next) => {
  try {
    const orderStats = await orderInstance.revenue();
    JsonResponse(res, 200, MSG_TYPES.FETCHED, orderStats);
    return
  } catch (error) {
    next(error)
    return
  }
};