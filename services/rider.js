const Admin = require("../models/admin");
const moment = require("moment");
const RiderCompanyRequest = require("../models/riderCompanyRequest");
const Order = require("../models/order");
const Entry = require("../models/entry");
const Rider = require("../models/rider");
const OnlineHistory = require("../models/onlineHistory");
const Company = require("../models/company");
const Transaction = require("../models/transaction");
const Verification = require("../templates/verification");
const { MSG_TYPES } = require("../constant/types");
const { UploadFileFromBinary, Mailer, GenerateToken, convertToDailyDataArray } = require("../utils");
const { populateMultiple } = require("../services/aggregate");
const { JsonResponse } = require("../lib/apiResponse");
const mongoose = require("mongoose");

class RiderService {
  /**
   * Create Rider account
   * @param {*} req
   * @param {*} res
   */
  create(body, files) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({
          $or: [{ phoneNumber: body.phoneNumber }, { email: body.email }],
        });
        if (rider) {
          reject({ code: 400, msg: MSG_TYPES.ACCOUNT_EXIST });
          return;
        }

        const fileFields = ["img","POI","POA","LASDRIID","POVO"];
        for await (let fileField of fileFields){
          if (files && files[fileField]) {
            const field = await UploadFileFromBinary(
              files[fileField].data,
              files[fileField].name
            );
            body[fileField] = field.Key;
          }
        }

        const token = GenerateToken(225);
        body.rememberToken = {
          token,
          expiredDate: moment().add(2, "days"),
        };

        const newRider = new Rider(body);

        await newRider.save();

        const subject = "Welcome to Exalt Logistics";
        const html = Verification(token, body.email, "rider");
        Mailer(body.email, subject, html);

        newRider.rememberToken = null;
        resolve(newRider);
      } catch (error) {
        console.log(error)
        reject(error);
        return;
      }
    });
  }

  /**
   * Send a request to a company
   * @param {String} company
   * @param {String} rider
   */
  sendCompanyRequest(company, rider) {
    return new Promise(async (resolve, reject) => {
      const request = new RiderCompanyRequest({
        company: company,
        rider: rider,
        status: "pending",
      });
      await request.save();

      resolve(request);
    });
  }

  /**
   * Update rider FCMToken from firebase
   * @param {Req} body
   * @param {Auth user} user
   */
  updateFCMToken(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({ _id: user.id, status: "active" });
        if (!rider) {
          reject({ code: 404, msg: "No Account found" });
          return;
        }

        await rider.updateOne({ FCMToken: body.FCMToken });

        resolve(rider);
      } catch (error) {
        console.log("error", error2);
        reject({ code: 404, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Delete One Rider by company
   * @param {Req} params
   * @param {Auth user} user
   */
  destroy(params, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const company = await Company.findOne({ _id: user.id });
        if (!company) {
          reject({ code: 404, msg: "Company Not Found!" });
          return;
        }

        const rider = await Rider.findOne({
          _id: params.riderId,
          company: company._id,
        });
        if (!rider) {
          reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
          return;
        }

        rider.deletedBy = user.id;
        rider.deleted = true;
        rider.deletedAt = Date.now();
        await rider.save();

        resolve(rider);
      } catch (error) {
        reject({ code: 404, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get rider accepted order list
   * @param {Auth user} user
   */
  getRiderBasket(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({ _id: user.id, status: "active" });
        if (!rider) {
          reject({ code: 404, msg: "Account not found" });
          return;
        }

        let order = await Order.find({
          rider: user.id,
          status: { $ne: "delivered" },
          // createdAt: { $gte: start, $lt: end },
        })
          // .populate("user", "name email phoneNumber countryCode")
          .populate(
            "entry",
            "status type source paymentMethod transaction itemType TEC TED TET"
          )
          .populate(
            "company",
            "name email phoneNumber type logo address countryCode"
          )
          .populate("transaction")
          .sort({ pickupType: -1 })
          .lean();

        order = await populateMultiple(order, "user", "name email phoneNumber countryCode");

        resolve(order);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get rider accepted order list
   * @param {Auth user} user
   */
  getRiderDeliveredBasket(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({ _id: user.id, status: "active" });
        if (!rider) {
          reject({ code: 404, msg: "Account not found" });
          return;
        }

        const start = moment().startOf("day");
        const end = moment().endOf("day");
        let order = await Order.find({
          rider: user.id,
          status: "delivered",
          createdAt: { $gte: start, $lt: end },
        })
          // .populate("user", "name email phoneNumber countryCode")
          .populate(
            "entry",
            "status type source paymentMethod transaction itemType TEC TED TET"
          )
          .populate(
            "company",
            "name email phoneNumber type logo address countryCode"
          )
          .populate("transaction")
          .lean();

        order = await populateMultiple(order, "user", "name email phoneNumber countryCode");

        resolve(order);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get rider's trips for the current month
   * @param {Auth user} user
   */
  getRiderTrips(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({ _id: user.id, status: "active" });
        if (!rider) {
          reject({ code: 404, msg: "Account not found" });
          return;
        }

        const monthStart = moment().startOf("month");
        const monthEnd = moment().endOf("month");

        const trips = await Order.find({
          rider: user.id,
          status: { $eq: "delivered" },
          createdAt: { $gte: monthStart, $lt: monthEnd },
        }).select("-_id status estimatedCost estimatedCostCurrency createdAt");

        resolve(trips);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get rider's transaction for the month
   * @param {Auth user} user
   */
  getRiderTransaction(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({ _id: user.id, status: "active" });
        if (!rider) {
          reject({ code: 404, msg: "Account not found" });
          return;
        }

        const monthStart = moment().startOf("month");
        const monthEnd = moment().endOf("month");

        const transaction = await Transaction.find({
          rider: user.id,
          status: { $eq: "approved" },
          createdAt: { $gte: monthStart, $lt: monthEnd },
        });

        resolve({ transaction, rider });
      } catch (error) {
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Rider goline and offline
   * @param {Object} body
   * @param {Object} AuthUser
   */
  toggleOnlineStatus(body, user) {
    return new Promise(async (resolve, reject) => {
      const rider = await Rider.findOne({
        _id: user.id,
        status: "active",
        verified: true,
      });
      if (!rider) {
        reject({ code: 400, msg: MSG_TYPES.NOT_FOUND });
        return;
      }

      let msg;
      if (rider.onlineStatus) {
        // to disable a rider account we need to know if they
        const entry = await Entry.findOne({
          rider: user.id,
          $or: [
            { status: "driverAccepted" },
            { status: "enrouteToPickup" },
            { status: "arrivedAtPickup" },
            { status: "pickedup" },
            { status: "enrouteToDelivery" },
            { status: "arrivedAtDelivery" },
            { status: "delivered" },
          ],
        });

        if (entry) {
          reject({ code: 400, msg: "You can't go offline while on a trip." });
          return;
        }

        msg = "Offline Successfully ";
        await rider.updateOne({
          onlineStatus: false,
          latitude: body.latitude,
          longitude: body.longitude,
        });
        const newOnelineHistory = new OnlineHistory({
          rider: user.id,
          status: "offline",
          latitude: body.latitude,
          longitude: body.longitude,
        });
        await newOnelineHistory.save();
      } else {
        msg = "Online Successfully ";
        await rider.updateOne({
          onlineStatus: true,
          latitude: body.latitude,
          longitude: body.longitude,
        });
        const newOnelineHistory = new OnlineHistory({
          rider: user.id,
          status: "online",
          latitude: body.latitude,
          longitude: body.longitude,
        });
        await newOnelineHistory.save();
      }

      resolve({ msg, rider });
    });
  }

  /**
   * Get rider's trip status by admin
   * @param {MongoDB ObjectId} riderId rider id
   */
  getDriverTripStatus(riderId) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if there are no completed orders or cancelled orders
        const order = await Order.findOne({
          rider: riderId,
          $or: [
            { status: "pickedup" },
            { status: "enrouteToDelivery" },
            { status: "arrivedAtDelivery" },
          ],
        });

        resolve({ order });
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Update password
   * @param {Object} body request body object
   */
  updatePassword(body) {
    return new Promise(async (resolve, reject) => {
      const activeUser = await User.findOne({
        _id: body.rider,
        verified: true,
        status: "active",
      });

      if (!activeUser) {
        reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        return;
      }

      let validPassword = await bcrypt.compare(
        body.oldPassword,
        activeUser.password
      );
      if (!validPassword) {
        reject({ code: 400, msg: "Wrong Password Entered" });
        return;
      }
      const updatedPassword = await bcrypt.hash(body.newPassword, 13);
      const updateUser = await User.updateOne(
        { _id: user.id },
        {
          $set: {
            password: updatedPassword,
          },
        }
      );

      resolve({ updateUser });
    });
  }

  /**
   * Change a rider's status - suspend,
   * @param {MongoDB ObjectId} riderId rider id
   */
  changeRiderStatus(riderId, companyId, newStatus) {
    return new Promise(async (resolve, reject) => {
      try {

        let rider = await Rider.findOne({
          _id: riderId,
          company: companyId,
        });
        if(!rider){
          return reject({code: 404, msg: "Rider not found"});
        }

        rider = rider.updateOne({status: newStatus});

        resolve(rider);
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get a rider's transactions
   * @param {Object} filter
   * @param {number} skip
   * @param {number} pageSize
   */
  getTransactions(filter, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const transactions = await Transaction.find(filter)
        .populate('user')
        .populate('rider')
        .populate('entry')
        .populate('card')
        .skip(skip)
        .limit(pageSize)
        .sort({createdAt: "desc"});

        const total = await Transaction.countDocuments(filter);

        resolve({ transactions, total });
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get a rider's orders
   * @param {Object} filter
   * @param {number} skip
   * @param {number} pageSize
   */
  getOrders(filter, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await Order.find(filter)
        // .populate("user", "-password -rememberToken")
        .skip(skip)
        .limit(pageSize)
        .sort({createdAt: "desc"})
        .lean();

        orders = await populateMultiple(orders, "user", "-password -rememberToken");

        const total = await Order.countDocuments(filter);

        resolve({ orders, total });
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  getRider(riderId) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({ _id: riderId })
        .populate("company")
        .select("-password")
        .lean();

        if(!rider){
          return reject({ code: 404, msg: 'Rider '+MSG_TYPES.NOT_FOUND});
        }

        const riderIsWithPackage = await Entry.findOne({
          rider: riderId,
          status: { $in: ["pickedup","enrouteToDelivery","arrivedAtDelivery"]}
        });

        rider.withPackage = riderIsWithPackage ? true : false;

        resolve(rider);
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  getEarningStatistics(riderId, date) {
    return new Promise(async (resolve, reject) => {
      try {
        const rider = await Rider.findOne({_id: riderId});
        if(!rider){
          return reject({code: 404, msg: "Rider not found"});
        }

        const baseFilter = {
          rider: mongoose.Types.ObjectId(riderId),
        }

        const beginningOfWeek = moment(date).startOf("isoWeek").toDate();
        const endOfWeek = moment(date).endOf("week").toDate();

        const dailyOrderFilter = {
          ...baseFilter,
          status: "delivered",
          createdAt: {
            $gte: beginningOfWeek,
            $lte: endOfWeek
          }
        }

        let data = await Order.aggregate([
          { $match: {...dailyOrderFilter } },
          { $group: {
              _id: {$dayOfWeek: "$createdAt"},
              amount: {$sum: "$estimatedCost"},
              distance: {$sum: "$estimatedDistance"}
            }
          },
          { $project: {
              _id:0,
              day:"$_id",
              amount: "$amount",
              distance: "$distance"
            }
          }
        ]);

        let totalAmount = await Entry.aggregate([
          { $match: { ...baseFilter, status: "completed" }},
          { $group: { _id: 1, "amount": { $sum: "$TEC" }}}
        ]);

        let totalDistance = await Order.aggregate([
          { $match: { ...baseFilter, status: "delivered" }},
          { $group: { _id: 1, "distance": { $sum: "$estimatedDistance"}}}
        ]);

        const totalOrders = await Order.countDocuments(baseFilter);

        totalAmount = totalAmount[0] ? totalAmount[0].amount.toFixed(2) : 0;
        totalDistance = totalDistance[0] ? totalDistance[0].distance.toFixed(2) : 0;

        data = {
          amounts: convertToDailyDataArray(data, "amount"),
          distances: convertToDailyDataArray(data, "distance"),
          totalAmount,
          totalDistance,
          totalOrders
        }


        resolve(data);
      } catch(error){
        console.log(error);
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    })
  }
}

module.exports = RiderService;