const config = require("config");
const io = require("socket.io-emitter");
const Company = require("../models/company");
const Entry = require("../models/entry");
const Rider = require("../models/rider");
const Transaction = require("../models/transaction");
const OrderService = require("../services/order");
const TripLogService = require("../services/triplog");
const EntryService = require("../services/entry");
const EntrySubscription = require("../subscription/entry");
const NotifyService = require("../services/notification");
const UserService = require("../services/user");
const {
  validateOrderID,
  validateOrderOTP,
  validateUserOrderID,
} = require("../request/order");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { SERVER_EVENTS } = require("../constant/events");
const { paginate } = require("../utils");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { validateRiderID } = require("../request/rating");
const moment = require("moment");
const CompanyService = require("../services/company");
const userInstance = new UserService();

/**
 * Start Delivery trigger by rider
 * @param {*} req
 * @param {*} res
 */
exports.riderInitiateOrderDelivery = async (req, res, next) => {
  try {
    const { error } = validateOrderID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const orderInstance = new OrderService();
    const { order, entry } = await orderInstance.startOrderDelivery(
      req.body,
      req.user
    );

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry);

    const user = await userInstance.get(
      { _id: entry.user },
      {
        FCMToken: 1,
      }
    );
    // send nofication to the user device
    const title = `Delivery for order #${order.orderId}`;
    const body = `Driver is on his way to this location: ${order.deliveryAddress}.`;
    const notifyInstance = new NotifyService();
    await notifyInstance.textNotify(title, body, user.FCMToken);

    JsonResponse(res, 200, MSG_TYPES.PROCEED_TO_DELIVERY);
    return;
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};

/**
 * Start Delivery trigger by rider
 * @param {*} req
 * @param {*} res
 */
exports.riderArriveAtDelivery = async (req, res, next) => {
  try {
    const { error } = validateOrderID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const orderInstance = new OrderService();
    const { order, entry, user } = await orderInstance.arriveAtLocation(
      req.body,
      req.user
    );

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry);

    // send nofication to the user device
    const title = `Driver has arrived`;
    const body = `Driver has arrived at the delivery location ${order.deliveryAddress}.`;
    const notifyInstance = new NotifyService();
    await notifyInstance.textNotify(title, body, user.FCMToken);

    JsonResponse(res, 200, MSG_TYPES.ARRIVED_AT_DELIVERY);
    return;
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};

/**
 * Driver Confirm OTP code for delivery
 * @param {*} req
 * @param {*} res
 */
exports.confirmDelivery = async (req, res, next) => {
  try {
    const { error } = validateOrderOTP(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const orderInstance = new OrderService();
    const { entry, msg } = await orderInstance.confirmDelivery(
      req.body,
      req.user
    );

    const user = await userInstance.get(
      { _id: entry.user },
      {
        FCMToken: 1,
      }
    );
    // send fcm notification
    // send nofication to the user device
    const title = msg;
    const body = "";
    const notifyInstance = new NotifyService();
    await notifyInstance.textNotify(title, body, user.FCMToken);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry);

    JsonResponse(res, 200, msg);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch order details
 * @param {*} req
 * @param {*} res
 */
exports.orderDetails = async (req, res, next) => {
  try {
    const { error } = validateUserOrderID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const orderInstance = new OrderService();
    const orderDetails = await orderInstance.getOrderDetails({
      orderId: req.body.orderId,
    });

    JsonResponse(
      res,
      200,
      "Order details retrieved successfully",
      orderDetails
    );
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Get order overview for the week
 * @param {*} req
 * @param {*} res
 */
exports.orderOverview = async (req, res, next) => {
  try {
    const { error } = validateRiderID({ rider: req.user.id });
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const beginningOfWeek = moment().startOf("isoWeek").toDate();
    const tripInstance = new TripLogService();
    const orderDetails = await tripInstance.getOverview({
      rider: mongoose.Types.ObjectId(req.user.id),
      type: "delivered",
      createdAt: { $gte: beginningOfWeek },
    });
    JsonResponse(res, 200, "Order overview fetched successfully", orderDetails);
    return;
  } catch (error) {
    next(error);
  }
};

exports.orderHistory = async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.orderId)) {
      return JsonResponse(res, 400, "Please provide a valid order ID");
    }

    const orderInstance = new OrderService();
    const orderDetails = await orderInstance.getOrderHistory(
      req.params.orderId
    );

    JsonResponse(
      res,
      200,
      "Order details retrieved successfully",
      orderDetails
    );
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders for a company
 * @param {*} req
 * @param {*} res
 */
exports.getCompanyOrders = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);
    const orderInstance = new OrderService();
    const companyInstance = new CompanyService();

    const company = await companyInstance.get({ _id: req.params.companyId });

    // Pull order query params from request route
    const orderQueryParams = ["status"];
    const orderQuery = {};
    for (let key in req.query) {
      if (orderQueryParams.hasOwnProperty(key)) {
        orderQuery[key] = req.query[key];
      }
    }

    const { orders, total } = await orderInstance.getAll(
      { company: company._id, ...orderQuery },
      {},
      "",
      { skip, pageSize }
    );
    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders, meta);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get order stats summary for a company
 * @param {*} req
 * @param {*} res
 */
exports.getCompanyOrderStats = async (req, res, next) => {
  try {
    const orderInstance = new OrderService();
    const companyInstance = new CompanyService();

    const company = await companyInstance.get({ _id: req.params.companyId });

    const total = await orderInstance.totalOrders({ company: company._id });
    // Get other totals - local, interstate, intl
    const statistics = {
      total: total,
      local: total,
      interstate: 0,
      international: 0,
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, statistics);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Decline an order
 * @param {*} req
 * @param {*} res
 */
exports.decline = async (req, res, next) => {
  try {
    const orderInstance = new OrderService();

    const { companyId, orderId } = req.params;

    const updatedOrder = await orderInstance.declineOrder(companyId, orderId);

    JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Delete an order
 * @param {*} req
 * @param {*} res
 */
exports.delete = async (req, res, next) => {
  try {
    const orderInstance = new OrderService();
    const { orderId } = req.params;

    await orderInstance.destroy(orderId, req.user.id);

    JsonResponse(res, 200, MSG_TYPES.DELETED);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Assign an order to a rider
 * @param {*} req
 * @param {*} res
 */
exports.assignOrderToRider = async (req, res, next) => {
  try {
    const orderInstance = new OrderService();
    const { orderId, riderId } = req.params;

    const updatedOrder = await orderInstance.assignToRider(
      orderId,
      riderId,
      req.user.id
    );

    JsonResponse(res, 200, MSG_TYPES.UPDATED, updatedOrder);
  } catch (error) {
    console.log(error);
    next(error);
  }
};


exports.adminCancelOrder = async (req, res, next) => {
  try {
    const orderInstance = new OrderService();
    const { orderId } = req.params;

    await orderInstance.adminCancelOrder(orderId);

    JsonResponse(res, 200, "Order cancelled successfully");
  } catch (error) {
    console.log(error);
    next(error);
  }
};