const mongoose = require("mongoose");
const config = require("config");
const moment = require("moment");
const Entry = require("../models/entry");
const Order = require("../models/order");
const Company = require("../models/company");
const Transaction = require("../models/transaction");
const RiderEntryRequest = require("../models/riderEntryRequest");
const Rider = require("../models/rider");
const TripLog = require("../models/tripLog")
const { MSG_TYPES } = require("../constant/types");
const { AsyncForEach } = require("../utils");



class TripLogService {
  /**
   * Log pickup initiation data
   * @param {ObjectID} rider
   * @param {String} user
   * @param {ObjectID} entry
   * @param {Array} order
   * @param {Number} latitude
   * @param {Number} longitude
   * @param {metaData} metaData
   */
  createLog(type, order, rider, user, entry, latitude, longitude, metaData = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const triplogged = [];
        await AsyncForEach(order, (data, index, arr) => {
          triplogged.push({
            type,
            rider: rider,
            user: user,
            entry: entry,
            order: data,
            latitude: latitude,
            longitude: longitude,
            metaData,
          });
        });

        const newTripLog = await TripLog.create(triplogged);

        resolve(newTripLog);
      } catch (error) {
        console.log("error", error);
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }


  /**
   * Log Order delivery initiation data
   * @param {ObjectID} rider
   * @param {String} user
   * @param {ObjectID} entry
   * @param {Array} order
   * @param {Number} latitude
   * @param {Number} longitude
   * @param {metaData} metaData
   */
  createOrderLog(type, order, rider, user, entry, latitude, longitude, metaData = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("Got Here and did this")
        const newTripLog = new TripLog({
          type,
          rider,
          user,
          entry,
          order,
          latitude,
          longitude,
          metaData,
        });
        console.log("Got Here and did this", newTripLog)
        await newTripLog.save();

        resolve(newTripLog);
      } catch (error) {
        console.log("error", error);
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get log for a trip(s)
   * @param {Object} filter
   * @param {Object} option
   * @param {String} populate
   */
  get(filter = {}, option = {}, populate = "") {
    return new Promise(async (resolve, reject) => {
      try {
        // get orders from trip log
        const orderLog = await TripLog.find(filter)
          .select(option)
          .populate(populate);

        if (!orderLog) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

        resolve(orderLog);
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get order overview from trip log
   * @param {Object} filter
   */

  getOverview(filter = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // aggregate info from the log sorted weekly
        const orderLog = await TripLog.aggregate([
          { $match: filter },
          {
            $lookup: {
              from: 'orders',
              localField: 'order',
              foreignField: '_id',
              as: 'order'
            }
          },
          { $unwind: '$order' },
          {
            $sort: {
              createdAt: -1
            }
          },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" },
                year: { $year: "$createdAt" }
              },
              totalOrders: { $sum: 1 },
              totalIncome: { $sum: "$order.estimatedCost" },
              totalDistance: { $sum: "$order.estimatedDistance" },
              data: { $push: "$$ROOT" }
            }
          },
          { $project: { "data": { "order": { "estimatedCostCurrency": 1, "estimatedCost": 1, "estimatedDistanceUnit": 1, "estimatedDistance": 1 }, }, "totalOrders": 1, "totalIncome": 1, "totalDistance": 1 } }
        ])

        if (!orderLog) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

        resolve(orderLog);
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }
}

module.exports = TripLogService;
