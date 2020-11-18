const mongoose = require("mongoose");
const config = require("config");
const Entry = require("../models/entry");
const Order = require("../models/order");
const Company = require("../models/company");
const { SocketResponse } = require("../lib/apiResponse");
const { AsyncForEach } = require("../utils");
const { MSG_TYPES } = require("../constant/types");
const { Client } = require("@googlemaps/google-maps-services-js");
const { nanoid } = require("nanoid");
const client = new Client({});

class EntryService {
  /**
   * Get a single ENtry
   * @param {Object} filter
   * @param {Object} option
   * @param {String} populate
   */
  get(filter = {}, option = {}, populate = "") {
    return new Promise(async (resolve, reject) => {
      try {
        // check if we have pricing for the location
        const entry = await Entry.findOne(filter)
          .select(option)
          .populate(populate);

        if (!entry) {
          reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        }

        resolve(entry);
      } catch (error) {
        console.log(error);
        reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        return;
      }
    });
  }

  /**
   * Create an entry
   * @param {Object} body
   */
  createEntry(body) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const newEntry = new Entry(body);
        await AsyncForEach(body.delivery, async (row, index, arr) => {
          body.delivery[index].entry = newEntry._id;
        });
        const newOrder = await Order.create(body.delivery, { session });

        newEntry.orders = newOrder;
        body.orders = newEntry.orders;
        await newEntry.save({ session: session });

        await session.commitTransaction();
        session.endSession();

        resolve(newEntry);
      } catch (error) {
        console.log(error);
        await session.abortTransaction();
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Calculate user Price more...
   * @param {Object} body pass the request body
   * @param {Object} user pass the auth user
   * @param {Object} distance google distance api response data
   * @param {Object} setting setting configuration
   * @param {Object} distancePrice setting configuration
   */
  calculateLocalEntry(body, user, distance, setting, distancePrice) {
    return new Promise(async (resolve, reject) => {
      try {
        body.TED = 0;
        body.TET = 0;
        body.TEC = 0;
        body.user = user.id;
        body.pickupAddress = distance.origin_addresses[0];
        body.metaData = {
          distance,
          distancePrice,
          setting,
        };
        // get item type price
        let itemTypePrice = 0;
        if (body.itemType === "Document") {
          itemTypePrice = setting.documentPrice;
        } else if (body.itemType === "Edible") {
          itemTypePrice = setting.ediblePrice;
        } else {
          itemTypePrice = setting.parcelPrice;
        }

        await AsyncForEach(distance.rows, async (row, rowIndex, rowsArr) => {
          await AsyncForEach(row.elements, (element, elemIndex, elemArr) => {
            if (element.status === "OK") {
              const time = parseFloat(element.duration.value / 60);
              const singleDistance = parseFloat(element.distance.value / 1000);
              // add user id
              body.delivery[elemIndex].user = user.id;

              // orderId
              body.delivery[elemIndex].orderId = nanoid(10);
              // add the pickup
              // add delivery address in text
              body.delivery[elemIndex].deliveryAddress =
                distance.destination_addresses[elemIndex];
              // add pickup details for each order
              body.delivery[elemIndex].pickupLatitude = body.pickupLatitude;
              body.delivery[elemIndex].pickupLongitude = body.pickupLongitude;
              body.delivery[elemIndex].pickupAddress =
                distance.origin_addresses[0];
              // set duration of an order from the pick up point to the delivery point
              body.delivery[elemIndex].estimatedTravelduration = time;
              // set distance of an order from the pick up point to the delivery point
              body.delivery[elemIndex].estimatedDistance = singleDistance;

              // total the distance travelled and time
              body.TET = body.TET + time;
              body.TED = body.TED + singleDistance;

              // estimated cost
              // calculate the km travelled for each trip multiplied by our price per km
              const km =
                parseFloat(singleDistance) * parseFloat(distancePrice.price);
              // calculate the weight of each order for each trip multiplied by our price per weight
              const weight =
                parseFloat(body.delivery[elemIndex].weight) *
                parseFloat(setting.weightPrice);
              const amount =
                parseFloat(km) +
                parseFloat(weight) +
                parseFloat(itemTypePrice) +
                parseFloat(setting.baseFare);

              // set price for each order
              body.delivery[elemIndex].estimatedCost = parseFloat(amount);
              // parseFloat(km) + parseFloat(weight) + parseFloat(setting.baseFare);

              // set total price for the entry
              body.TEC = body.TEC + parseFloat(amount);
            } else {
              // very questionable
              // just for test only
              // delete body.delivery[elemIndex];
              reject({
                code: 404,
                msg:
                  "We couldn't process your request. Please contact our support",
              });
            }
          });
        });

        resolve(body);
      } catch (error) {
        console.log(error);
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Send pool via socket to all companies
   * @param {Socket Pointer} socket
   */
  getPool(socket) {
    return new Promise(async (resolve, reject) => {
      // validate country
      if (socket.user.type !== "company") {
        reject(SocketResponse(true, "Company Socket"));
        return;
      }

      const company = await Company.findOne({
        _id: socket.user.id,
        $or: [{ status: "active" }, { status: "inactive" }],
        verified: true,
      });

      if (!company) {
        reject(SocketResponse(true, "Company Account Not Found"));
        return;
      }

      const entries = await Entry.find({
        source: "pool",
        status: "pending",
        state: company.state,
        company: null,
      }).select("-metaData");

      resolve(SocketResponse(false, "ok", entries));
    });
  }

  /**
   * Send pool via socket to all companies
   * @param {Socket Pointer} socket
   */
  getPoolAdmin(socket) {
    return new Promise(async (resolve, reject) => {
      // validate country
      if (socket.user.type !== "admin") {
        reject(SocketResponse(true, "Admin Socket"));
        return;
      }

      const entries = await Entry.find({
        source: "pool",
      }).select("-metaData");

      resolve(SocketResponse(false, "ok", entries));
    });
  }

  /**
   * Calculate the distance and duration via google API
   * @param {Object} body
   */
  getDistanceMetrix(body) {
    return new Promise(async (resolve, reject) => {
      try {
        // get all coords locations and sort them.
        const origins = [
          { lat: body.pickupLatitude, lng: body.pickupLongitude },
        ];
        const destinations = [];
        // get all origin and destination
        await AsyncForEach(body.delivery, (data, index, arr) => {
          destinations.push({
            lat: data.deliveryLatitude,
            lng: data.deliveryLongitude,
          });
        });

        console.log("origins", origins);
        console.log("destinations", destinations);

        // get distance and duration from google map distance matrix
        const N = 5000;
        const distance = await client.distancematrix({
          params: {
            origins,
            destinations,
            key: config.get("googleMap.key"),
            travelMode: "DRIVING",
            drivingOptions: {
              departureTime: new Date(Date.now() + N), // for the time N milliseconds from now.
              trafficModel: "optimistic",
            },
            avoidTolls: false,
          },
        });

        resolve(distance);
      } catch (error) {
        console.log(error);
        reject({ err: 400, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }
}

module.exports = EntryService;
