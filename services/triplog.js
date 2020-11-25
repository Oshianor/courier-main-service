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
  createLog(type, order, rider, user, entry, latitude, longitude, metaData={}) {
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
}

module.exports = TripLogService;
