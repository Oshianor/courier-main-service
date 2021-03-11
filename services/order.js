const mongoose = require("mongoose");
const Order = require("../models/order");
const Company = require("../models/company");
const Entry = require("../models/entry");
const Rider = require("../models/rider");
const TripLogService = require("./triplog");
const NotificationService = require("./notification");
const { MSG_TYPES } = require("../constant/types");
const { AsyncForEach, GenerateOTP, Mailer } = require("../utils");
const OTPCode = require("../templates/otpCode");
const TripLog = require("../models/tripLog");
const moment = require("moment");
const UserService = require("./user");
const EntryService = require("./entry");
const TransactionService = require("./transaction");
const userInstance = new UserService();


class OrderService {
  /**
   * Get a single Order
   * @param {Object} filter
   * @param {Object} option
   * @param {String} populate
   */
  get(filter = {}, option = {}, populate = "") {
    return new Promise(async (resolve, reject) => {
      try{
         // check if we have pricing for the location
        const order = await Order.findOne(filter)
        .select(option)
        .populate(populate);

        if (!order) {
          reject({ code: 404, msg: "Order not found" });
        }
        resolve(order);
      } catch(error){
        console.log(error)
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get multiple Orders
   * @param {Object} filter
   * @param {Object} option
   * @param {String} populate
   * @param {Object} pagination - { skip, pageSize }
   */
  getAll(filter = {}, option = {}, populate = "", pagination = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const orders = await Order.find(filter)
          .select(option)
          .populate(populate)
          .skip(pagination.skip)
          .limit(pagination.pageSize)
          .sort({ createdAt: "desc" });

        const total = await Order.find(filter).countDocuments();

        resolve({ orders, total });
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Update Mutiple Orders
   * @param {Object} filter
   * @param {Object} set
   */
  updateAll(filter = {}, set = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if we have pricing for the location
        const order = await Order.updateMany(filter, set);

        resolve(order);
      } catch (error) {
        console.log(error);
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Start Delivery trigger by rider
   * @param {Object} body request body
   * @param {*} user authenticated user
   */
  startOrderDelivery(body, user) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();
      try {
        // start our transaction
        session.startTransaction();

        const rider = await Rider.findOne({
          _id: user.id,
          status: "active",
          onlineStatus: true,
          verified: true,
        });
        if (!rider) {
          reject({ code: 404, msg: "You can't accept this order" });
          return;
        }

        const company = await Company.findOne({
          _id: rider.company,
          status: "active",
          verified: true,
        });

        if (!company) {
          reject({ code: 404, msg: "Your company account doesn't exist" });
          return;
        }

        // check if the order has not been taken by another rider
        const order = await Order.findOne({
          _id: body.order,
          status: "pickedup",
          company: company._id,
          rider: rider._id,
        });

        if (!order) {
          reject({ code: 404, msg: "This order doesn't exist." });
          return;
        }

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: order.entry,
          $or: [{ status: "pickedup" }, { status: "delivered" }],
          company: company._id,
          rider: rider._id,
        }).lean();

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }

        // find out if the rider is already on a delivery trip
        const onTrip = await Order.findOne({
          $or: [
            { status: "enrouteToDelivery" },
            { status: "arrivedAtDelivery" },
          ],
          company: company._id,
          rider: rider._id,
        });

        if (onTrip) {
          reject({
            code: 400,
            msg: `You have to conclude this order #${onTrip.orderId} delivery before you can begin another`,
          });
          return;
        }

        // update the order and entry status
        await order.updateOne({ status: "enrouteToDelivery" }, { session });
        await Entry.updateOne(
          { _id: order.entry },
          { status: "enrouteToDelivery" },
          { session }
        );

        // log the user last location
        const logs = {
          type: "enrouteToDelivery",
          order: order._id,
          rider: rider._id,
          user: entry.user,
          entry: entry._id,
          latitude: rider.latitude,
          longitude: rider.longitude,
          metaData: {},
        };
        const tripLogInstance = new TripLogService();
        await tripLogInstance.createOrderLog(logs, session);

        await session.commitTransaction();
        session.endSession();

        resolve({ order, entry, rider, company });
      } catch (error) {
        console.log("error", error);
        await session.abortTransaction();
        reject(error);
        return;
      }
    });
  }

  /**
   * Driver arrive at delivery location
   * @param {Object} body request body
   * @param {*} user authenticated user
   */
  arriveAtLocation(body, user) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();

      try {
        // start our transaction
        session.startTransaction();

        const rider = await Rider.findOne({
          _id: user.id,
          status: "active",
          onlineStatus: true,
          verified: true,
        });
        if (!rider) {
          reject({ code: 404, msg: "You can't accept this order" });
          return;
        }

        const company = await Company.findOne({
          _id: rider.company,
          status: "active",
          verified: true,
        });

        if (!company) {
          reject({ code: 404, msg: "Your company account doesn't exist" });
          return;
        }

        // check if the order has not been taken by another rider
        const order = await Order.findOne({
          _id: body.order,
          status: "enrouteToDelivery",
          company: company._id,
          rider: rider._id,
        });

        if (!order) {
          reject({ code: 404, msg: "This order doesn't exist." });
          return;
        }

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: order.entry,
          status: "enrouteToDelivery",
          company: company._id,
          rider: rider._id,
        }).lean();

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }


        const token = GenerateOTP(4);

        // update the order and entry status
        await order.updateOne(
          { status: "arrivedAtDelivery", OTPCode: token },
          { session }
        );
        await Entry.updateOne(
          { _id: order.entry },
          { status: "arrivedAtDelivery" },
          { session }
        );

        // send OTP code to the receipant
        const subject = `Delivery OTP Code for ${order.orderId}`;
        const html = OTPCode(token);
        Mailer(order.email, subject, html);

        // send OTP code
        const notifyInstance = new NotificationService();
        const msg = `Your delivery verification OTP code is ${token} for #${order.orderId}`;
        const to = order.countryCode + order.phoneNumber;
        await notifyInstance.sendOTPByTermii(msg, to);

        // get the user details of the person that created the shipment
        const entryUser = await userInstance.get(
          { _id: entry.user },
          {
            FCMToken: 1,
            email: 1,
            countryCode: 1,
            phoneNumber: 1,
          }
        );
        // if the email assigned to the entry isn't the same as the
        // user that created the post email then send to both parties
        if (entryUser.email !== order.email) {
          Mailer(entryUser.email, subject, html);
          const toUser = entryUser.countryCode + entryUser.phoneNumber;
          await notifyInstance.sendOTPByTermii(msg, toUser);
        }

        // log trip status
        const logs = {
          type: "arrivedAtDelivery",
          order: order._id,
          rider: rider._id,
          user: entry.user,
          entry: entry._id,
          latitude: rider.latitude,
          longitude: rider.longitude,
          metaData: {
            OTPCode: token,
          },
        };
        // log the user last location
        const tripLogInstance = new TripLogService();
        await tripLogInstance.createOrderLog(logs, session);

        await session.commitTransaction();
        session.endSession();

        resolve({ order, entry, rider, company, user });
      } catch (error) {
        await session.abortTransaction();
        reject(error);
      }
    });
  }

  /**
   * Driver arrive at delivery location
   * @param {Object} body request body
   * @param {*} user authenticated user
   */
  confirmDelivery(body, user) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();

      try {
        // start our transaction
        session.startTransaction();

        const rider = await Rider.findOne({
          _id: user.id,
          status: "active",
          onlineStatus: true,
          verified: true,
        });
        if (!rider) {
          reject({ code: 404, msg: "You can't accept this order" });
          return;
        }

        const company = await Company.findOne({
          _id: rider.company,
          status: "active",
          verified: true,
        });

        if (!company) {
          reject({ code: 404, msg: "Your company account doesn't exist" });
          return;
        }

        // check if the order has not been taken by another rider
        const order = await Order.findOne({
          _id: body.order,
          status: "arrivedAtDelivery",
          company: company._id,
          rider: rider._id,
        });

        if (!order) {
          reject({ code: 404, msg: "This order doesn't exist." });
          return;
        }

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: order.entry,
          status: "arrivedAtDelivery",
          company: company._id,
          rider: rider._id,
        }).lean();

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }


        // get the total tries
        // check if the rider has made more than 3 tries
        // now check based on timer
        const count = 2;
        const tries = order.OTPRecord.length;
        const leftTries = tries - count;
        console.log("leftTries", leftTries);
        if (leftTries > 0) {
          console.log("should show this");
          const lastRecord = order.OTPRecord[tries - 1];
          if (typeof lastRecord !== "undefined") {
            console.log("should show this too");

            const lastRecordDate = moment(lastRecord.createdAt);
            const currentDate = moment();
            const timeLeft = currentDate.diff(lastRecordDate, "minute");
            console.log("timeLeft", timeLeft);
            console.log("lastRecordDate", lastRecordDate);
            console.log("currentDate", currentDate);
            // check if the last OTP record is more than 10 mins
            if (timeLeft < 10) {
              reject({
                code: 400,
                msg: `Please try again in ${Math.abs(timeLeft - 10)} mins`,
              });

              return;
            }
          }
        }

        // when the OTPCode is wrong.
        if (order.OTPCode !== body.OTPCode) {
          const data = {
            OTPCode: body.OTPCode,
            latitude: rider.latitude,
            longitude: rider.longitude,
          };

          // a record to the order details
          await order.updateOne({
            $push: { OTPRecord: data },
          });

          // const leftTries = order.OTPRecord.length - count;
          reject({
            code: 400,
            msg: `Wrong confirmation code. You have ${Math.abs(
              leftTries
            )} try left`,
          });

          return;
        }

        // entry.status = "delivered";
        // entry.OTPCode = null;
        order.status = "delivered";

        console.log("Got Here");
        const logs = {
          type: "delivered",
          order: order._id,
          rider: rider._id,
          user: entry.user,
          entry: entry._id,
          latitude: rider.latitude,
          longitude: rider.longitude,
          metaData: {},
        };
        const tripLogInstance = new TripLogService();
        await tripLogInstance.createOrderLog(logs, session);

        // await entry.save({ session });
        await Entry.updateOne(
          { _id: order.entry },
          { status: "delivered", OTPCode: null },
          { session }
        );
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        // check if all orders has been processed
        const orderNotDelivered = await Order.findOne({
          entry: entry._id,
          status: { $ne: "delivered" },
        });

        if (!orderNotDelivered) {
          await Entry.updateOne({ _id: entry._id }, { status: "completed" });

          resolve({
            entry,
            rider,
            company,
            msg: "Congrats!. All orders has been completed",
          });
          return;
        } else {
          resolve({
            entry,
            rider,
            company,
            msg: `Delivery for order #${order.orderId} confirmed. `,
          });
          return;
        }
      } catch (error) {
        await session.abortTransaction();
        reject(error);
      }
    });
  }

  /**
   * Get order details
   * @param {Object} filter
   */
  getOrderDetails(filter = {}) {
    return new Promise(async (resolve, reject) => {
      // check if we have pricing for the location
      const order = await Order.findOne(filter)
        .select({ OTPRecord: 0, OTPCode: 0 })
        .populate(
          "rider",
          " -_id name email phoneNumber plateNumber img countryCode"
        )
        .populate("vehicle")
        .populate("transaction")
        .populate(
          "entry",
          "status type source paymentMethod transaction itemType TEC TED TET vehicle"
        );

      if (!order) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

      resolve(order);
    });
  }

  /**
   * Get order history
   * @param {Object} orderId order id to find transaction history
   */
  getOrderHistory(orderId) {
    return new Promise(async (resolve, reject) => {
      const logs = await TripLog.find({ order: orderId })
        .sort({ createdAt: 1 })
        .select({ metaData: 0 });
      resolve(logs);
    });
  }

  /**
   * Get total orders
   * @param {Object} filter
   */
  totalOrders(filter = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const total = await Order.countDocuments(filter);
        if (total < 0) {
          reject({ code: 404, msg: "No Orders" });
        }
        resolve(total);
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  /**
   * Get revenue
   */
  revenue() {
    return new Promise(async (resolve, reject) => {
      try {
        // const totalRevenue = Order.aggregate(
        //   [
        //     {
        //       $group:
        //       {
        //         totalAmount: { $sum: "$estimatedCost" },
        //         count: { $sum: 1 }
        //       }
        //     }
        //   ]
        // )
        // resolve(totalRevenue);
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  /**
   * Decline an order
   * @param {ObjectId} companyId
   * @param {ObjectId} orderId
   */
  declineOrder(companyId, orderId) {
    return new Promise(async (resolve, reject) => {
      try {
        let order = await Order.findOne({ _id: orderId, company: companyId });
        if (!order) {
          return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        }

        order = await order.updateOne({ status: "declined" });

        resolve(order);
      } catch (error) {
        return reject(error);
      }
    });
  }

  /**
   * Delete One Order by company
   * @param {ObjectId} orderId
   * @param {ObjectId} useriD
   */
  destroy(orderId, userId) {
    return new Promise(async (resolve, reject) => {
      try {
        const order = await Order.findOne({
          _id: orderId,
          company: userId,
        });

        if (!order) {
          return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        }

        order.deletedBy = userId;
        order.deleted = true;
        order.deletedAt = Date.now();
        await order.save();

        resolve(order);
      } catch (error) {
        reject({ code: 404, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Assign an order to a rider
   * @param {ObjectId} orderId
   * @param {ObjectId} riderId
   * @param {ObjectId} companyId
   */
  assignToRider(orderId, riderId, companyId) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({ _id: riderId, company: companyId });
        let order = await Order.findOne({ _id: orderId, company: companyId });

        if (!order || !rider) {
          return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        }

        order.rider = rider._id;
        order = await order.save();

        resolve(order);
      } catch (error) {
        reject({ code: 404, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * @param {ObjectId} orderId
   */
  adminCancelOrder(orderId){
    return new Promise(async(resolve, reject) => {
      const order = await this.get({_id: orderId});

      if(!["request","pending"].includes(order.status)){
        return reject({code: 400, msg: "You can't cancel an already accepted or cancelled order"});
      }

      const updatedOrder = await this.updateAll(
        { _id: orderId },
        { status: "cancelled" }
      );

      // Cancel whole entry if all orders in it are cancelled
      const entryService = new EntryService();
      const transactionService = new TransactionService();
      const entry = await entryService.get({_id: order.entry},"","orders");

      if(entry && entry.orders){
        const allOrdersCancelled = entry.orders.every((order) => order.status === "cancelled");
        if(allOrdersCancelled){
          await entry.updateOne({status: "cancelled"});
          await transactionService.updateAll({entry: order.entry}, {status: "declined"});
        }
      }

      const updatedEntry = await entryService.get({_id: order.entry}, "","orders");

      resolve(updatedEntry);
    })
  }

  removeOrderFromRiderBasket(riderId, orderId){
    return new Promise(async(resolve, reject) => {
      try{
        const entryService = new EntryService();
        const transactionService = new TransactionService();

        console.log('Before => ', );

        const order = await this.get({_id: orderId, rider: riderId});
        console.log('after => ', order);
        const entry = await entryService.get({_id: order.entry, rider: riderId});


        if(!["driverAccepted","enrouteToPickup"].includes(entry.status)){
          return reject({code: 400, msg: "You can no longer cancel this order"});
        }

        console.log('dsdsa 1')
        await entry.updateOne({status: "companyAccepted", riderAcceptedAt: null, rider: null});
        await this.updateAll({entry: entry._id, rider: riderId}, { status: "pending", rider: null});
        await transactionService.updateAll({entry: entry._id, rider: riderId}, {rider: null});
        console.log('dsdsa 2')

        resolve()
      } catch(error){
        console.log('Erroradadwq', error);
        return reject({code: error.code||500, msg: error.msg||MSG_TYPES.SERVER_ERROR});
      }
    })
  }
}

module.exports = OrderService;
