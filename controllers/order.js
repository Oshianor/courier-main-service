const config = require("config");
const io = require("socket.io-emitter");
const Company = require("../models/company");
const Entry = require("../models/entry");
const Rider = require("../models/rider");
const Transaction = require("../models/transaction");
const OrderService = require("../services/order");
const EntryService = require("../services/entry");
const EntrySubscription = require("../subscription/entry");
const NotifyService = require("../services/notification");
const UserService = require("../services/user");
const { validateOrderID, validateOrderOTP } = require("../request/order");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { SERVER_EVENTS } = require("../constant/events");
const { paginate } = require("../utils");


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
    notifyInstance.textNotify(title, body, entry.user.FCMToken);

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
    notifyInstance.textNotify(title, body, entry.user.FCMToken);

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
    notifyInstance.textNotify(title, body, entry.user.FCMToken);
    
    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 200, msg);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};
