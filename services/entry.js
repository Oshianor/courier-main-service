const mongoose = require("mongoose");
const config = require("config");
const moment = require("moment");
const Entry = require("../models/entry");
const User = require("../models/users");
const Order = require("../models/order");
const Company = require("../models/company");
const Transaction = require("../models/transaction");
const RiderEntryRequest = require("../models/riderEntryRequest");
const Rider = require("../models/rider");
const UserService = require("./user");
const CompanyService = require("./company");
const TripLogService = require("./triplog");
const NotificationService = require("./notification");
const paystack = require("paystack")(config.get("paystack.secret"));
const { nanoid } = require("nanoid");
const {
  AsyncForEach,
  GenerateOTP,
  Mailer,
  UploadFileFromBase64,
} = require("../utils");
const { OTPCode } = require("../templates");
const { MSG_TYPES } = require("../constant/types");
const { Client } = require("@googlemaps/google-maps-services-js");
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
   * @param {Object} vehicle vehicle configuration
   */
  calculateLocalEntry(body, user, distance, setting, distancePrice, vehicle) {
    return new Promise(async (resolve, reject) => {
      try {
        const pickup = await this.getGooglePlace(body.address);
        body.pickupLatitude = pickup.results[0].geometry.location.lat;
        body.pickupLongitude = pickup.results[0].geometry.location.lng;
        body.TED = 0;
        body.TET = 0;
        body.TEC = 0;
        body.user = user.id;
        body.deliveryAddresses = distance.destination_addresses;
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

        const devy = await this.getGooglePlace(distance.destination_addresses.join(","));

        await AsyncForEach(distance.rows, async (row, rowIndex, rowsArr) => {
          await AsyncForEach(row.elements, async (element, elemIndex, elemArr) => {
            if (element.status === "OK") {

              // set the coordinates for each deverly address
              body.delivery[elemIndex].deliveryLatitude =
                devy.results[elemIndex].geometry.location.lat;
              body.delivery[elemIndex].deliveryLongitude =
                devy.results[elemIndex].geometry.location.lng;

                // set the coordinates for pickup address
              body.delivery[elemIndex].pickupLatitude = pickup.results[0].geometry.location.lat;
              body.delivery[elemIndex].pickupLongitude = pickup.results[0].geometry.location.lng;

              const time = parseFloat(element.duration.value / 60);
              const singleDistance = parseFloat(element.distance.value / 1000);
              // add user id
              body.delivery[elemIndex].user = user.id;

              // orderId
              body.delivery[elemIndex].orderId = nanoid(8);
              // add the pickup
              // add delivery address in text
              body.delivery[elemIndex].deliveryAddress =
                distance.destination_addresses[elemIndex];
              // add pickup details for each order
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
                parseFloat(vehicle.weight) * parseFloat(setting.weightPrice);
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

  // parseFloat(body.delivery[elemIndex].weight) *

  /**
   * Upload array of images
   * @param {Array} images
   */
  uploadArrayOfImages(images) {
    return new Promise(async (resolve, reject) => {
      // console.log("images", images);
      const img = [];
      await AsyncForEach(images, async (row, rowIndex, arr) => {
        const ObjectId = mongoose.Types.ObjectId();
        const file = await UploadFileFromBase64(row, ObjectId);
        img.push(file.Key);
      });

      resolve(img);
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
        const origins = [body.address];
        const destinations = [];
        // get all origin and destination
        await AsyncForEach(body.delivery, (data, index, arr) => {
          destinations.push(data.address);
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

        if (distance.data.status !== "OK") {
          reject({ code: 500, msg: "Address provided is invalid" });
          return;
        }

        resolve(distance);
      } catch (error) {
        console.log(error);
        reject({ err: 400, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Find the address on google maps
   * @param {string} address
   */
  getGooglePlace(address) {
    return new Promise(async (resolve, reject) => {
      try {
        const distance = await client.geocode({
          params: {
            address,
            language: "en",
            key: config.get("googleMap.key"),
          },
        });

        console.log("distance", JSON.stringify(distance.data));
        console.log("distance", distance.data);

        if (distance.data.status !== "OK") {
          reject({ code: 400, msg: "Your address couldn't be verified" });
          return 
        }

        resolve(distance.data);
      } catch (error) {
        console.log("error distance", error);
        reject({ code: 400, msg: "Your address couldn't be verified" });
      }
    });
  }

  /**
   * Create transaction for entry
   * @param {Object} body
   * @param {Object} user
   * @param {String} token
   */
  createTransaction(body, user, token) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();
      try {
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "request",
          user: user.id,
        }).populate("vehicle");

        if (!entry) {
          reject({
            code: 404,
            msg: "Entry transaction already processed.",
          });
          return;
        }

        console.log("entry", entry);

        let msgRES;
        if (body.paymentMethod === "card") {
          const userInstance = new UserService();
          const card = await userInstance.getCard(token, body.card);

          const trans = await paystack.transaction.charge({
            reference: nanoid(20),
            authorization_code: card.data.token,
            email: user.email,
            // email: "abundance@gmail.com",
            amount: parseFloat(entry.TEC).toFixed(2) * 100,
          });
          console.log("trans", trans);

          if (!trans.status) {
            reject({
              code: 404,
              msg: "Your Transaction could't be processed at the moment",
            });
            return;
          }
          if (trans.data.status !== "success") {
            reject({
              code: 404,
              msg: "Your Transaction could't be processed at the moment",
            });
            return;
          }

          body.amount = entry.TEC;
          body.user = user.id;
          body.status = "approved";
          body.approvedAt = new Date();
          body.entry = entry;
          body.txRef = trans.data.reference;

          msgRES = "Payment Successfully Processed";
        } else {
          body.amount = entry.TEC;
          body.user = user.id;
          body.status = "pending";
          body.entry = entry;
          body.txRef = nanoid(10);

          msgRES = "Cash Payment Method Confirmed";
        }

        // start our transaction
        session.startTransaction();

        const newTransaction = new Transaction(body);

        entry.transaction = newTransaction;
        entry.status = "pending";
        entry.approvedAt = new Date();
        entry.paymentMethod = body.paymentMethod;
        await newTransaction.save({ session });
        await entry.save({ session });
        await Order.updateMany(
          { entry: entry._id },
          { transaction: newTransaction._id },
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        // console.log("entry", entry);

        // send out new entry that has apporved payment method
        entry.metaData = null;
        resolve({ entry, msg: msgRES });
      } catch (error) {
        console.log("error", error);
        reject({
          code: 500,
          msg: "Your Transaction could't be processed at the moment",
        });
      }
    });
  }

  /**
   * Company accept entry
   * @param {String} params
   * @param {Auth user Object} user
   */
  companyAcceptEntry(params, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const companyInstance = new CompanyService();
        const company = await companyInstance.get({
          _id: user.id,
          // $or: [{ status: "active" }, { status: "inactive" }],
          status: "active",
          verified: true,
        });

        const transaction = await Transaction.findOne({ entry: params.entry });

        if (!transaction) {
          reject({ code: 400, msg: "This entry cannot be processed." });
          return;
        }

        // const currentDate = new Date();
        const entry = await this.get({
          _id: params.entry,
          // status: "pending",
          // company: null,
        });

        if (entry.company) {
          reject({
            code: 400,
            msg: "This entry has already been taken. Better luck next time",
          });
          return;
        }

        if (entry.status !== "pending") {
          reject({ code: 400, msg: "This entry doesn't exist" });
          return;
        }

        if (!company.vehicles.includes(entry.vehicle)) {
          reject({ code: 400, msg: MSG_TYPES.VEHICLE_NOT_SUPPORTED });
          return;
        }

        await entry.updateOne({
          company: user.id,
          companyAcceptedAt: new Date(),
          status: "companyAccepted",
        });

        await Order.updateMany({ entry: params.entry }, { company: user.id });

        await transaction.updateOne({ company: user.id });

        resolve(entry);
      } catch (error) {
        console.log("error", error);
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Company send rider request
   * @param {Object} body
   * @param {Auth user Object} user
   */
  riderAsignEntry(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        // find the company
        const companyInstance = new CompanyService();
        const company = await companyInstance.get({
          _id: user.id,
          status: "active",
          verified: true,
        });

        // find the entry that has been accepted by a company
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "companyAccepted",
          company: company._id,
          rider: null,
          transaction: { $ne: null },
        })
          .populate("orders")
          .populate("user", "name email phoneNumber countryCode")
          .select("-metaData");

        if (!entry) {
          reject({ code: 404, msg: "No Entry was found" });
          return;
        }

        console.log("entry.vehicle", entry.vehicle);

        // find all the online riders for the company with the specific vehicle type
        const riders = await Rider.find({
          company: company._id,
          deleted: false,
          onlineStatus: true,
          status: "active",
          verified: true,
          vehicle: entry.vehicle,
        });

        console.log("riders", riders);

        if (typeof riders[0] == "undefined") {
          reject({
            code: 404,
            msg:
              "No online Rider was found for this order. Please contact your riders",
          });
          return;
        }

        const riderIDS = [];
        const riderEntries = [];
        await AsyncForEach(riders, async (row, index, arr) => {
          // find all orders for ech rider that has not yet been concluded or cancelled
          const orders = await Order.findOne({
            rider: row._id,
            $or: [
              { status: { $ne: "delivered" } },
              { status: { $ne: "cancelled" } },
            ],
          }).countDocuments();

          // check how many orders a driver is currently on
          // if the driver is in less than 10 riders then send him to those orders
          if (orders < 10) {
            riderIDS.push(row._id);
            riderEntries.push({
              entry: entry._id,
              company: company._id,
              rider: row._id,
            });
          }

          // const reqEntry = await RiderEntryRequest.findOne({
          //   rider: body.rider,
          //   status: "pending",
          // });

          // // if he has any pending at all
          // if (reqEntry) {
          //   // if rider has already been sent this request and it's pending
          //   if (String(reqEntry.entry) === body.entry) {
          //     reject({ code: 400, msg: "Rider already assigned this entry." });
          //     return;
          //   }

          //   reject({ code: 400, msg: "Rider already has a pending request" });
          //   return;
          // }
        });
        // send the request to the driver
        // const newRiderReq = new RiderEntryRequest({
        //   entry: entry._id,
        //   company: company._id,
        //   rider: body.rider,
        // });

        // await newRiderReq.save();

        const newRiderReq = await RiderEntryRequest.create(riderEntries);

        resolve({ entry, company, riders, newRiderReq, riderIDS });
      } catch (error) {
        console.log("error", error);
        reject(error);
      }
    });
  }

  /**
   * Rider accepts entry
   * @param {Object} body
   * @param {Auth User} user
   */
  riderAcceptEntry(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const currentDate = new Date();

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
          reject({ code: 404, msg: "You can't accept this order" });
          return;
        }

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: body.entry,
          rider: null,
          status: "companyAccepted",
          company: company._id,
        });

        if (!entry) {
          reject({ code: 404, msg: "Entry already taken by another Rider" });
          return;
        }

        const transaction = await Transaction.findOne({ entry: body.entry });

        if (!transaction) {
          reject({ code: 400, msg: "This entry cannot be processed." });
          return;
        }

        // check if the rider was assigned any request for the entry
        const reqEntry = await RiderEntryRequest.findOne({
          rider: user.id,
          entry: body.entry,
          status: "pending",
        });

        if (!reqEntry) {
          reject({ code: 404, msg: "No request was assign to you." });
          return;
        }

        await entry.updateOne({
          rider: user.id,
          riderAcceptedAt: currentDate,
          status: "driverAccepted",
        });

        await Order.updateMany({ entry: body.entry }, { rider: user.id });

        await reqEntry.updateOne({ status: "accepted" });

        await transaction.updateOne({ rider: user.id });

        resolve({ entry, reqEntry });
      } catch (error) {
        console.log("error", error);
        reject(error);
      }
    });
  }

  /**
   * Rider reject entry
   * @param {Object} body
   * @param {Auth User} user
   */
  riderRejectEntry(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
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

        // check if the rider was assigned any request for the entry
        const reqEntry = await RiderEntryRequest.findOne({
          rider: user.id,
          entry: body.entry,
          status: "pending",
        });

        if (!reqEntry) {
          reject({ code: 404, msg: "No request was assign to you." });
          return;
        }

        await reqEntry.updateOne({ status: "declined" });

        resolve(reqEntry);
      } catch (error) {
        reject({ code: 400, msg: "You can't reject this order" });
      }
    });
  }

  /**
   * Rider starts pickup
   * @param {Object} body
   * @param {Auth User} user
   */
  riderStartEntryPickup(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
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

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "driverAccepted",
          company: company._id,
          rider: rider._id,
        }).populate("user");

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }

        await entry.updateOne({ status: "enrouteToPickup" });
        // update all order status
        await Order.updateMany(
          { entry: entry._id },
          { status: "enrouteToPickup" }
        );

        // log trip status
        const tripLogInstance = new TripLogService();
        await tripLogInstance.createLog(
          "enrouteToPickup",
          entry.orders,
          rider._id,
          entry.user,
          entry._id,
          rider.latitude,
          rider.longitude
        );

        // resolve(entry);
        resolve({ entry, rider, company });
      } catch (error) {
        console.log("error", error);
        reject({
          code: 400,
          msg: "Something went wrong. You can't proceed to pickup",
        });
      }
    });
  }

  /**
   * Rider Arrive a pickup location
   * @param {Object} body
   * @param {Auth User} user
   */
  riderArriveAtPickup(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
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

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "enrouteToPickup",
          company: company._id,
          rider: rider._id,
        }).populate("user");

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }

        const token = GenerateOTP(4);

        // update the status to delivery updated
        await entry.updateOne({ status: "arrivedAtPickup", OTPCode: token });
        // update all order status
        await Order.updateMany(
          { entry: entry._id },
          { status: "arrivedAtPickup" }
        );

        // send OTP code to the receipant
        const subject = "Pickup OTP Code";
        const html = OTPCode(token);
        Mailer(entry.email, subject, html);

        // send OTP code
        const notifyInstance = new NotificationService();
        const msg = `Your Pickup verification OTP code is ${token}`;
        const to = entry.countryCode + entry.phoneNumber;
        await notifyInstance.sendOTPByTermii(msg, to);

        // if the email assigned to the entry isn't the same as the
        // user that created the post email then send to both parties
        if (entry.user.email !== entry.email) {
          Mailer(entry.user.email, subject, html);
          const toUser = entry.user.countryCode + entry.user.phoneNumber;
          await notifyInstance.sendOTPByTermii(msg, toUser);
        }

        // log trip status
        const metaData = {
          OTPCode: token,
        };
        const tripLogInstance = new TripLogService();
        await tripLogInstance.createLog(
          "arrivedAtPickup",
          entry.orders,
          rider._id,
          entry.user,
          entry._id,
          rider.latitude,
          rider.longitude,
          metaData
        );

        resolve({ entry, rider, company });
      } catch (error) {
        console.log("error", error);
        reject({
          code: 400,
          msg: "Something went wrong. You can't proceed to pickup",
        });
      }
    });
  }

  /**
   * Rider confirm user cash payment at pickup location
   * @param {Object} body
   * @param {Auth User} user
   */
  riderConfirmCashPayment(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
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

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "arrivedAtPickup",
          company: company._id,
          rider: rider._id,
        }).populate("user");

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }

        // check if the payment method is cash
        if (entry.paymentMethod === "card") {
          reject({
            code: 400,
            msg: "You can't approve a entry that isn't a cash payment",
          });
          return;
        }

        const transaction = await Transaction.findOne({
          entry: body.entry,
          paymentMethod: "cash",
          status: "pending",
        });

        if (!transaction) {
          reject({
            code: 404,
            msg: "No Transaction was found for this entry",
          });
          return;
        }

        // when rider select declined on payment status
        if (body.status === "declined") {
          await transaction.updateOne({ status: "declined" });
          await entry.updateOne({
            status: "cancelled",
            cancelledAt: new Date(),
          });
          await Order.updateMany(
            { entry: entry._id },
            { status: "cancelled", cancelledAt: new Date() }
          );

          const tripLogInstance = new TripLogService();
          await tripLogInstance.createLog(
            "cancelled",
            entry.orders,
            rider._id,
            entry.user,
            entry._id,
            rider.latitude,
            rider.longitude
          );

          resolve({
            entry,
            rider,
            company,
            transaction,
            code: 200,
            msg:
              "You've successfully declined this payment and the order has been cancelled for this trip.",
          });
          return;
        }

        const currentDate = new Date();
        await transaction.updateOne({
          status: "approved",
          approvedAt: currentDate,
        });

        const tripLogInstance = new TripLogService();
        await tripLogInstance.createLog(
          "confirmPayment",
          entry.orders,
          rider._id,
          entry.user,
          entry._id,
          rider.latitude,
          rider.longitude
        );

        resolve({
          entry,
          rider,
          company,
          transaction,
          code: 200,
          msg: "Payment has been approved successfully.",
        });
      } catch (error) {
        console.log("error", error);
        reject({
          code: 400,
          msg:
            "Something went wrong. You can't confirm the payment for this order",
        });
      }
    });
  }

  /**
   * Driver Confirm OTP code for pickup
   * @param {Object} body
   * @param {Auth User} user
   */
  riderComfirmPickupOTPCode(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
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

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "arrivedAtPickup",
          company: company._id,
          rider: rider._id,
        }).populate("user");

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }

        // check if the payment method is cash
        if (entry.paymentMethod === "cash") {
          const transaction = await Transaction.findOne({ entry: body.entry });
          if (!transaction) {
            reject({
              code: 404,
              msg: "No Transaction was found for this entry",
            });
            return;
          }

          if (transaction.status !== "approved") {
            reject({
              code: 400,
              msg: `You need confirm payment before confirming pickup.`,
            });

            return;
          }
        }

        // get the total tries
        // check if the rider has made more than 3 tries
        // now check based on timer
        const count = 2;
        const tries = entry.OTPRecord.length;
        const leftTries = tries - count;
        console.log("leftTries", leftTries);
        if (leftTries > 0) {
          console.log("should show this");
          const lastRecord = entry.OTPRecord[tries - 1];
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
        if (entry.OTPCode !== body.OTPCode) {
          const data = {
            OTPCode: body.OTPCode,
            latitude: rider.latitude,
            longitude: rider.longitude,
          };

          // a record to the entry details
          await entry.updateOne({
            $push: { OTPRecord: data },
          });

          // const leftTries = entry.OTPRecord.length - count;
          reject({
            code: 400,
            msg: `Wrong confirmation code. You have ${Math.abs(
              leftTries
            )} try left`,
          });

          return;
        }

        // update the status to delivery updated
        await entry.updateOne({ status: "pickedup", OTPCode: null });
        // update all order status
        await Order.updateMany({ entry: entry._id }, { status: "pickedup" });

        const tripLogInstance = new TripLogService();
        await tripLogInstance.createLog(
          "pickedup",
          entry.orders,
          rider._id,
          entry.user,
          entry._id,
          rider.latitude,
          rider.longitude
        );

        resolve({ entry, rider, company });
      } catch (error) {
        console.log("error", error);
        reject({
          code: 400,
          msg: "Something went wrong. You can't proceed to pickup",
        });
      }
    });
  }
}




module.exports = EntryService;
