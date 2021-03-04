const config = require("config");
const TripLog = require("../models/tripLog");
const { MSG_TYPES } = require("../constant/types");
const { AsyncForEach } = require("../utils");
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

class TripLogService {
  /**
   * Log pickup initiation data
   * @param {Object} logs
   * @param {String} session
   */
  createLog(logs, session) {
    return new Promise(async (resolve, reject) => {
      try {
        const triplogged = [];
        const add = await this.getGooglePlaceFromCoords(
          `${logs.latitude},${logs.longitude}`
        );
        // logs.metaData.address = add;
        await AsyncForEach(logs.order, (data, index, arr) => {
          triplogged.push({
            ...logs,
            order: data,
            address: add.results[0].formatted_address,
          });
        });

        const newTripLog = await TripLog.create(triplogged, { session });

        resolve(newTripLog);
      } catch (error) {
        reject(error)
      }
    });
  }

  /**
   * Log Order delivery initiation data
   * @param {Object} logs
   * @param {String} session
   */
  createOrderLog(logs, session) {
    return new Promise(async (resolve, reject) => {
      try {
        const add = await this.getGooglePlaceFromCoords(
          `${logs.latitude},${logs.longitude}`
        );

        // logs.metaData.address = add;
        const newTripLog = new TripLog({
          ...logs,
          address: add.results[0].formatted_address,
        });
        await newTripLog.save({ session });

        resolve(newTripLog);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Find the address by the coordinates
   * @param {string} latlng
   */
  getGooglePlaceFromCoords(latlng) {
    return new Promise(async (resolve, reject) => {
      try {
        const distance = await client.geocode({
          params: {
            latlng,
            language: "en",
            key: config.get("googleMap.key"),
          },
        });

        // console.log("distance", JSON.stringify(distance.data));
        // console.log("distance", distance.data);

        resolve(distance.data);
      } catch (error) {
        console.log("error distance", error);
        reject({ code: 400, msg: "Your address couldn't be verified" });
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
              from: "orders",
              localField: "order",
              foreignField: "_id",
              as: "order",
            },
          },
          { $unwind: "$order" },
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" },
                year: { $year: "$createdAt" },
              },
              totalOrders: { $sum: 1 },
              totalIncome: { $sum: "$order.estimatedCost" },
              totalDistance: { $sum: "$order.estimatedDistance" },
              data: { $push: "$$ROOT" },
            },
          },
          {
            $project: {
              data: {
                order: {
                  estimatedCostCurrency: 1,
                  estimatedCost: 1,
                  estimatedDistanceUnit: 1,
                  estimatedDistance: 1,
                },
              },
              totalOrders: 1,
              totalIncome: 1,
              totalDistance: 1,
            },
          },
        ]);

        if (!orderLog) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

        resolve(orderLog);
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }
}

module.exports = TripLogService;
