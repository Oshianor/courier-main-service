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
const { validateOrderID, validateOrderOTP, validateUserOrderID } = require("../request/order");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { SERVER_EVENTS } = require("../constant/events");
const { paginate } = require("../utils");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { validateRiderID } = require("../request/rating");
const moment = require("moment");




/**
 * Start Delivery trigger by rider
 * @param {*} req
 * @param {*} res
 */
exports.riderInitiateOrderDelivery = async (req, res) => {
  try {
    const { error } = validateOrderID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);


    const orderInstance = new OrderService();
    const { order, entry } = await orderInstance.startOrderDelivery(req.body, req.user);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    // send nofication to the user device
    const title = `Delivery for order #${order.orderId}`;
    const body = `Driver is on his way to ${order.deliveryAddress}.`;
    const notifyInstance = new NotifyService();
    await notifyInstance.textNotify(title, body, entry.user.FCMToken);

    JsonResponse(res, 200, MSG_TYPES.PROCEED_TO_DELIVERY);
    return;
  } catch (error) {
    console.log("error", error);
    return JsonResponse(res, error.code, error.msg);
  }
};



/**
 * Start Delivery trigger by rider
 * @param {*} req
 * @param {*} res
 */
exports.riderArriveAtDelivery = async (req, res) => {
  try {
    const { error } = validateOrderID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);


    const orderInstance = new OrderService();
    const { order, entry } = await orderInstance.arriveAtLocation(req.body, req.user);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    // send nofication to the user device
    const title = `Driver has arrived`;
    const body = `Driver has arrived at the delivery location ${order.deliveryAddress}.`;
    const notifyInstance = new NotifyService();
    await notifyInstance.textNotify(title, body, entry.user.FCMToken);

    JsonResponse(res, 200, MSG_TYPES.ARRIVED_AT_DELIVERY);
    return;
  } catch (error) {
    console.log("error", error);
    return JsonResponse(res, error.code, error.msg);
  }
};


/**
 * Driver Confirm OTP code for delivery
 * @param {*} req 
 * @param {*} res 
 */
exports.confirmDelivery = async (req, res) => {
  try {
    const { error } = validateOrderOTP(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const orderInstance = new OrderService();
    const { entry, msg } = await orderInstance.confirmDelivery(req.body, req.user);

    // send fcm notification
    // send nofication to the user device
    const title = msg;
    const body = "";
    const notifyInstance = new NotifyService();
    await notifyInstance.textNotify(title, body, entry.user.FCMToken);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 200, msg);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Fetch order details
 * @param {*} req 
 * @param {*} res 
 */
exports.orderDetails = async (req, res) => {
  try {
    const { error } = validateUserOrderID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const orderInstance = new OrderService();
    const orderDetails = await orderInstance.getOrderDetails({ orderId: req.body.orderId });

    JsonResponse(res, 200, 'Order details retrieved successfully', orderDetails);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Get order overview for the week
 * @param {*} req 
 * @param {*} res 
 */
exports.orderOverview = async (req, res) => {
  try {
    const { error } = validateRiderID({ rider: req.user.id });
    if (error) return JsonResponse(res, 400, error.details[0].message);

    
    const beginningOfWeek = moment().startOf('isoWeek').toDate();
    const tripInstance = new TripLogService();
    const orderDetails = await tripInstance.getOverview({ rider: mongoose.Types.ObjectId(req.user.id), type: 'delivered', createdAt: { $gte: beginningOfWeek } });
    JsonResponse(res, 200, 'Order overview fetched successfully', orderDetails);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};  


exports.orderHistory = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.orderId)) {
      return JsonResponse(res, 400, "Please provide a valid order ID");
    }

    const orderInstance = new OrderService();
    const orderDetails = await orderInstance.getOrderHistory(
      req.params.orderId
    );

    JsonResponse(res, 200, 'Order details retrieved successfully', orderDetails);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};