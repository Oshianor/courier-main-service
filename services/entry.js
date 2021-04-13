const mongoose = require("mongoose");
const config = require("config");
const moment = require("moment");
const Entry = require("../models/entry");
const Order = require("../models/order");
const Company = require("../models/company");
const Transaction = require("../models/transaction");
const RiderEntryRequest = require("../models/riderEntryRequest");
const Pricing = require("../models/pricing");
const Rider = require("../models/rider");
const Shipment = require("../models/shipment");
const TripLogService = require("./triplog");
const UserService = require("./user");
const NotificationService = require("./notification");
const { nanoid } = require("nanoid");
const {
  AsyncForEach,
  GenerateOTP,
  Mailer,
  UploadFileFromBase64,
} = require("../utils");
const OTPCode = require("../templates/otpCode");
const { MSG_TYPES } = require("../constant/types");
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});
const DPService = require("../services/distancePrice");
const SettingService = require("../services/setting");
const VehicleService = require("../services/vehicle");
const CountryService = require("../services/country");
const userInstance = new UserService();


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
          reject({ code: 404, msg: "Entry not found" });
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
        let newEntry = null;
        await session.withTransaction(async () => {
          // await session.startTransaction();

          newEntry = new Entry(body);
          await AsyncForEach(body.delivery, async (row, index, arr) => {
            body.delivery[index].entry = newEntry._id;
          });
          const newOrder = await Order.create(body.delivery, { session });

          newEntry.orders = newOrder;
          body.orders = newEntry.orders;
          await newEntry.save({ session: session });
        });

        session.endSession();
        resolve(newEntry);
      } catch (error) {
        console.log("Session => ", error);
        await session.abortTransaction();
        reject(error);
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
        // const pickup = await this.getGooglePlace(body.address);
        // const devy = await this.getGooglePlace(
        //   distance.destination_addresses
        // );
        // body.pickupLatitude = pickup[0].geometry.location.lat;
        // body.pickupLongitude = pickup[0].geometry.location.lng;
        body.TED = 0;
        body.TET = 0;
        body.TEC = 0;
        body.user = user.id;
        body.instantPricing = setting.instantPricing;
        body.deliveryAddresses = distance.destination_addresses;
        body.pickupAddress = distance.origin_addresses[0];

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
          await AsyncForEach(
            row.elements,
            async (element, elemIndex, elemArr) => {
              if (element.status === "OK") {
                // const devy = await this.getGooglePlace(
                //   distance.destination_addresses[elemIndex]
                // );
                // set the coordinates for each deverly address
                // body.delivery[elemIndex].deliveryLatitude =
                //   devy[0].geometry.location.lat;
                // body.delivery[elemIndex].deliveryLongitude =
                //   devy[0].geometry.location.lng;

                // set the coordinates for pickup address
                body.delivery[elemIndex].pickupLatitude = body.pickupLatitude;
                // pickup[0].geometry.location.lat;
                body.delivery[elemIndex].pickupLongitude = body.pickupLongitude;
                // pickup[0].geometry.location.lng;

                const time = parseFloat(element.duration.value / 60);
                const singleDistance = parseFloat(
                  element.distance.value / 1000
                );
                // add user id
                body.delivery[elemIndex].user = user.id;
                body.delivery[elemIndex].instantPricing =
                  setting.instantPricing;
                body.delivery[elemIndex].vehicle = body.vehicle;

                // orderId
                body.delivery[elemIndex].orderId = nanoid(8);
                // set company id on individual orders
                body.delivery[elemIndex].company = body.company;
                // set enterprise id on individual enterprise account
                body.delivery[elemIndex].enterprise = body.enterprise;
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

                let amount;
                if(
                  user.enterprise &&
                  user.enterprise.paymentType === "fixed" &&
                  user.enterprise.fixedPaymentPrice
                  ){
                  // Use fixed payment price for enterprise accounts using that
                  amount = user.enterprise.fixedPaymentPrice;
                  body.metaData = {
                    paymentType: "fixed",
                    fixedPaymentPrice: user.enterprise.fixedPaymentPrice
                  }
                } else {
                  // Use calculated amount
                  // estimated cost
                  // calculate the km travelled for each trip multiplied by our price per km
                  const km = parseFloat(singleDistance) * parseFloat(distancePrice.price);
                  // calculate the weight of each order for each trip multiplied by our price per weight
                  const weight = parseFloat(vehicle.weight) * parseFloat(setting.weightPrice);
                  amount =
                    parseFloat(km) +
                    parseFloat(weight) +
                    parseFloat(itemTypePrice) +
                    parseFloat(setting.baseFare);

                  body.metaData = {
                    distance,
                    distancePrice,
                    setting,
                  };
                }

                // set price for each order
                body.delivery[elemIndex].estimatedCost =
                  Math.ceil(parseFloat(amount) / 100) * 100;
                // parseFloat(km) + parseFloat(weight) + parseFloat(setting.baseFare);

                // set total price for the entry
                body.TEC = body.TEC + Math.ceil(parseFloat(amount) / 100) * 100;
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
            }
          );
        });

        resolve(body);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  calculateBulkEntry(body, user, distance){
    return new Promise(async (resolve, reject) => {
      try {
        const settingInstance = new SettingService();
        const DPInstance = new DPService();
        const VehicleInstance = new VehicleService();
        const countryInstance = new CountryService();

        await countryInstance.getCountryAndState(body.country, body.state);
        // find a single vehicle to have access to the weight
        const vehicle = await VehicleInstance.get(body.vehicle);

        // check if we have pricing for the location
        const distancePrice = await DPInstance.get({
          country: body.country,
          state: body.state,
          vehicle: body.vehicle,
        });

        // get admin settings pricing
        const setting = await settingInstance.get({ source: "admin" });

        const entryData = { ...body };
        delete entryData.delivery;

        const entries = [];
        const numOrdersPerEntry = 10;
        const groupedDeliveries = this.chunkArray(body.deliveries, numOrdersPerEntry);

        for(let deliveries of groupedDeliveries){
          entries.push({
            ...entryData,
            deliveries
          });
        }

        for(let entry of entries){
          entry.TED = 0;
          entry.TET = 0;
          entry.TEC = 0;
          entry.user = user.id;
          entry.instantPricing = setting.instantPricing;
          entry.deliveryAddresses = entry.deliveries.map((delivery) => delivery.address.address);
          entry.pickupAddress = distance.origin_addresses[0];

          // get item type price
          let itemTypePrice = 0;
          if (entry.itemType === "Document") {
            itemTypePrice = setting.documentPrice;
          } else {
            itemTypePrice = setting.parcelPrice;
          }
          // const ordered
          for(let delivery of entry.deliveries){
            delivery.pickupLatitude = entry.pickupLatitude;
            delivery.pickupLongitude = entry.pickupLongitude;

            const time = parseFloat(delivery.distance.duration.value / 60);
            const singleDistance = parseFloat(delivery.distance.distance.value / 1000);
            // add user id
            delivery.user = user.id;
            delivery.instantPricing = setting.instantPricing;
            delivery.vehicle = entry.vehicle;

            // orderId
            delivery.orderId = nanoid(8);
            // set company id on individual orders
            delivery.company = entry.company;
            // set enterprise id on individual enterprise account
            delivery.enterprise = entry.enterprise;
            // add pickup details for each order
            delivery.pickupAddress = distance.origin_addresses[0];
            // set duration of an order from the pick up point to the delivery point
            delivery.estimatedTravelduration = time;
            // set distance of an order from the pick up point to the delivery point
            delivery.estimatedDistance = singleDistance;

            delivery.deliveryLongitude = delivery.address.location.coordinates[0];
            delivery.deliveryLatitude = delivery.address.location.coordinates[1];
            delivery.countryCode = delivery.address.countryCode;
            delivery.phoneNumber = delivery.address.phoneNumber;
            delivery.state = delivery.address.state;
            delivery.country = delivery.address.country;
            delivery.name = delivery.address.fullName;
            delivery.email = delivery.address.email;

            delete delivery.address;
            delete delivery.distance;

            // total the distance travelled and time
            entry.TET = entry.TET + time;
            entry.TED = entry.TED + singleDistance;

            let amount;
            if(
              user.enterprise &&
              user.enterprise.paymentType === "fixed" &&
              user.enterprise.fixedPaymentPrice
            ){
              // Use fixed payment price for enterprise accounts using that
              amount = user.enterprise.fixedPaymentPrice;
              body.metaData = {
                paymentType: "fixed",
                fixedPaymentPrice: user.enterprise.fixedPaymentPrice
              }
            } else {
              // Use calculated amount
              // estimated cost
              // calculate the km travelled for each trip multiplied by our price per km
              const km = parseFloat(singleDistance) * parseFloat(distancePrice.price);
              // calculate the weight of each order for each trip multiplied by our price per weight
              const weight = parseFloat(vehicle.weight) * parseFloat(setting.weightPrice);
              amount =
                parseFloat(km) +
                parseFloat(weight) +
                parseFloat(itemTypePrice) +
                parseFloat(setting.baseFare);

              body.metaData = {
                distance,
                distancePrice,
                setting,
              };
            }

            // set price for each order
            delivery.estimatedCost = Math.ceil(parseFloat(amount) / 100) * 100;
            // set total price for the entry
            entry.TEC = entry.TEC + Math.ceil(parseFloat(amount) / 100) * 100;
          }
        }

        // create entries and orders
        return resolve(entries);
      } catch(error){
        console.log(error);
        reject({code: 500, msg: MSG_TYPES.SERVER_ERROR});
      }
    })

  }

  /**
   * Create an entry
   * @param {Object} body
   */
  createBulkEntries(entries, parentEntry) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();
      try {
        const createdEntries = [];
        for await(let entry of entries){
          await session.withTransaction(async() => {

            const newEntry = new Entry(entry);
            await AsyncForEach(entry.deliveries, async (row, index, arr) => {
              entry.deliveries[index].entry = newEntry._id;
            });
            const newOrders = await Order.create(entry.deliveries, { session });

            newEntry.orders = newOrders;
            entry.orders = newEntry.orders;
            const createdEntry = await newEntry.save({ session: session });

            createdEntries.push(createdEntry);
          });
        }

        const shipmentRecord = await this.createMultipleEntryShipmentRecord(createdEntries, parentEntry, session);

        session.endSession();
        resolve(shipmentRecord);
        // resolve(createdEntries);
      } catch (error) {
        console.log('Session => ', error);
        await session.abortTransaction();
        reject(error);
      }
    });
  }

  /**
   *
   * @param {Array} entries array of related entries - from either bulk entry or interstate
   */
  createMultipleEntryShipmentRecord(entries, parentEntry = null, session){
    return new Promise(async(resolve, reject) => {
      try{

        const entryIds = entries.map((entry) => entry._id);
        if(parentEntry){
          entryIds.push(parentEntry);
        }

        entries = await Entry.find({_id: { $in: entryIds }})
        .populate("orders");

        const orderIds = entries.map((entry) => {
          return entry.orders.map((order) => order._id);
        }).flat();

        const totalEstimatedCost = entries.reduce((prev, next) => {
          return prev + next.TEC;
        }, 0);

        const totalEstimatedDistance = entries.reduce((prev, next) => {
          return prev + next.TED;
        }, 0);

        const totalEstimatedTime = entries.reduce((prev, next) => {
          return prev + next.TET;
        }, 0);

        let shipment = null;
        await session.withTransaction(async () => {
          shipment = await Shipment.create([{
            entries: entryIds,
            orders: orderIds,
            TEC: totalEstimatedCost,
            TET: totalEstimatedTime,
            TED: totalEstimatedDistance,
            parentEntry,
            user: entries[0].user,
            enterprise: entries[0].enterprise,
            company: entries[0].company,
            instantPricing: entries[0].instantPricing
          }], { session });
        });

        await Entry.updateMany({_id: { $in: entryIds }}, { shipment: shipment[0]._id});

        resolve(shipment[0]);
      } catch(error){
        console.log('error => ', error);
        return reject({code: 500, msg: MSG_TYPES.SERVER_ERROR});
      }
    })
  }

  chunkArray(array, chunkSize){
    return Array(Math.ceil(array.length / chunkSize))
      .fill()
      .map((_, index) => index * chunkSize)
      .map(begin => array.slice(begin, begin + chunkSize));
  }

  sortOrdersByDistance(deliveries, distance){
    return new Promise(async(resolve, reject) => {
      try{
        for(let i = 0; i < deliveries.length; i++){
          deliveries[i].distance = distance.rows[0].elements[i];
          deliveries[i].deliveryAddress = distance.destination_addresses[i];
        }

        // console.log('Body => ', body);
        // console.log('Distance matrix data => ', distance);
        // for (let i = 0; i < deliveries.length; i++) {
        //   const firstDeliveryLong = deliveries[0].address.location.coordinates[0];
        //   const firstDeliveryLat = deliveries[0].address.location.coordinates[1];

        //   const currentDeliveryLong = deliveries[i].address.location.coordinates[0];
        //   const currentDeliveryLat = deliveries[i].address.location.coordinates[1];

        //   deliveries[i]["distance"] = this.calculateDistance(firstDeliveryLat,firstDeliveryLong, currentDeliveryLat, currentDeliveryLong,"K");
        // }

        deliveries.sort(function(a, b) {
          return getDistanceNumber(a.distance) - getDistanceNumber(b.distance);

          function getDistanceNumber(distance){
            return Number(distance.distance.text.replace("km",""));
          }
        });

        resolve(deliveries);

      } catch(error){
        console.log('Error [group]=> ', error)
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR});
      }
    })
  }

  calculateDistance(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    // var radlon1 = Math.PI * lon1/180
    // var radlon2 = Math.PI * lon2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist;
  }

  /**
   * Calculate shipment for interstate
   * @returns Object
   */
  calculateInterStateEntry(body, user, vehicle, interstatePrice, distance) {
    return new Promise(async (resolve, reject) => {
      try {

        const data = distance.rows[0].elements[0];
        console.log("data", data);
        const time = parseFloat(data.duration.value / 60);
        const singleDistance = parseFloat(data.distance.value / 1000);
        const entryType = "interState";

        body.type = entryType;
        body.TET = time;
        body.TED = singleDistance;
        body.TEC = interstatePrice.price;
        body.user = user.id;
        body.pickupAddress = distance?.origin_addresses[0],
        body.deliveryAddresses = distance?.destination_addresses;
        body.enterprise = body.enterprise,
        body.company = body.company,
        body.delivery = [
          {
            state: interstatePrice.interStateAddress.state,
            itemName: "box",
            pickupAddress: distance?.origin_addresses[0],
            estimatedTravelduration: time,
            estimatedDistance: singleDistance,
            country: interstatePrice.interStateAddress.country,
            phoneNumber: interstatePrice.interStateAddress.phoneNumber,
            name: interstatePrice.interStateAddress.name,
            countryCode: interstatePrice.interStateAddress.countryCode,
            deliveryAddress: interstatePrice.interStateAddress.address,
            pickupLatitude: body.pickupLatitude,
            pickupLongitude: body.pickupLongitude,
            deliveryLatitude: interstatePrice.interStateAddress.lat,
            deliveryLongitude: interstatePrice.interStateAddress.lng,
            user: user.id,
            orderId: nanoid(8),
            enterprise: body.enterprise,
            company: body.company,
            estimatedCost: interstatePrice.price,
            vehicle: vehicle._id,
            type: entryType
          },
        ];

        body.vehicle = vehicle._id;

        resolve(body);
      } catch (error) {
        reject(error);
      }
    });
  }

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
   *
   */
  getDistanceMetrix(pickupLongLat, deliveryLongLats) {
    return new Promise(async (resolve, reject) => {
      try {

        const origins = [
          { lng: pickupLongLat[0], lat: pickupLongLat[1] },
        ];
        const destinations = deliveryLongLats.map((longLat) => ({
          lng: longLat[0],
          lat: longLat[1]
        }));

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

        // console.log("distance", distance.data);
        // console.log("distance", distance.data.rows);

        if (distance.data.status !== "OK") {
          reject({ code: 500, msg: "Location provided is invalid" });
          return;
        }

        resolve(distance);
      } catch (error) {
        console.log(error);
        reject({ err: 400, msg: "Address provided couldn't be verified" });
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

        // console.log("distance", JSON.stringify(distance.data));
        // console.log("distance", distance.data);
        // console.log("distance", distance.data.results);

        if (distance.data.status !== "OK") {
          reject({ code: 400, msg: "Your address couldn't be verified" });
          return;
        }

        resolve(distance.data.results);
      } catch (error) {
        console.log("error distance", error);
        reject({ code: 400, msg: "Your address couldn't be verified" });
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
      const session = await mongoose.startSession();
      try {
        const company = await Company.findOne({
          _id: user.id,
          status: "active",
          verified: true,
        });

        if (!company) {
          reject({ code: 400, msg: "No company account was found." });
          return;
        }

        const transactions = await Transaction.find({ entry: params.entry });

        if (!transactions.length) {
          reject({ code: 400, msg: "This entry cannot be processed." });
          return;
        }

        // check if this company still has any unprocessed entry
        const unprocessedEntry = await Entry.findOne({
          company: user.id,
          status: "companyAccepted",
        });
        if (unprocessedEntry) {
          reject({
            code: 404,
            msg:
              "You have an order that has not been accepted by a rider. Please process that order first before accepting another.",
          });
          return;
        }

        const pricing = await Pricing.findOne({ _id: company.tier });
        if (!pricing) {
          reject({
            code: 400,
            msg: "You're currently not on any plan at the moment",
          });
          return;
        }

        // const currentDate = new Date();
        const entry = await Entry.findOne({
          _id: params.entry,
          // approvedAt: { $lt: lateTimerMap[pricing.priority] },
        });

        if (!entry) {
          reject({
            code: 404,
            msg: "This order wasn't found.",
          });
          return;
        }

        // check the plan of the user
        const lateTimerMap = [
          moment(entry.approvedAt).add(20, "minutes"),
          moment(entry.approvedAt).add(5, "minutes"),
          moment(entry.approvedAt),
        ];

        console.log(
          "lateTimerMap[pricing.priority]",
          lateTimerMap[pricing.priority]
        );

        console.log("entry.approvedAt", moment(entry.approvedAt));

        console.log(
          "moment(entry.approvedAt) <= lateTimerMap[pricing.priority]",
          moment(entry.approvedAt) >= lateTimerMap[pricing.priority]
        );

        if (moment(entry.approvedAt).isAfter(lateTimerMap[pricing.priority])) {
          reject({
            code: 404,
            msg: "Upgrade your plan to accepts orders immediately",
          });
          return;
        }

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

        // start our transaction
        session.startTransaction();

        await entry.updateOne(
          {
            company: user.id,
            companyAcceptedAt: new Date(),
            status: "companyAccepted",
          },
          { session }
        );

        await Order.updateMany(
          { entry: params.entry },
          { company: user.id },
          { session }
        );

        // calculate our commision from the company pricing plan
        for await (let transaction of transactions) {
          const commissionAmount = parseFloat(
            (transaction.amount * pricing.transactionCost) / 100
          );

          await transaction.updateOne(
            {
              company: user.id,
              commissionPercent: pricing.transactionCost,
              commissionAmount,
              amountWOcommision:
                parseFloat(transaction.amount) - parseFloat(commissionAmount),
            },
            { session }
          );
        }

        await session.commitTransaction();
        session.endSession();

        resolve(entry);
      } catch (error) {
        await session.abortTransaction();
        reject(error);
      }
    });
  }

  /**
   * Company send rider request
   * @param {Object} body
   * @param {MongoDB ObjectID} company
   */
  riderAsignEntry(body, company) {
    return new Promise(async (resolve, reject) => {
      try {
        // find the entry that has been accepted by a company
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "companyAccepted",
          company,
          rider: null,
          transaction: { $ne: null },
        })
          .lean()
          .populate(
            "orders",
            "-OTPCode -OTPRecord -metaData -riderRated -riderRating -userRating -userRated -deleted -deletedAt -deletedBy"
          )
          .select("-metaData");

        if (!entry) {
          reject({ code: 404, msg: "No Entry was found" });
          return;
        }

        const user = await userInstance.get(
          { _id: entry.user },
          {
            name: 1,
            email: 1,
            group: 1,
            countryCode: 1,
            phoneNumber: 1,
            role: 1,
            img: 1,
          }
        );
        entry.user = user;

        // find all the online riders for the company with the specific vehicle type
        const riders = await Rider.find({
          company,
          deleted: false,
          onlineStatus: true,
          status: "active",
          verified: true,
          vehicle: entry.vehicle,
        });

        // console.log("riders", riders);
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
          const orders = await Order.countDocuments({
            rider: row._id,
            $or: [
              { status: "pending" },
              { status: "enrouteToPickup" },
              { status: "arrivedAtPickup" },
              { status: "pickedup" },
              { status: "enrouteToDelivery" },
              { status: "arrivedAtDelivery" },
            ],
          });

          // check how many orders a driver is currently on
          // if the driver is in less than 10 riders then send him to those orders
          if (orders < 10) {
            riderIDS.push(row._id);
            riderEntries.push({
              entry: entry._id,
              company,
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

        console.log("riderEntries", riderEntries);

        if (typeof riderEntries[0] === "undefined") {
          reject({
            code: 404,
            msg:
              "No free Rider was found for this order. Please contact your riders",
          });
          return;
        }

        const newRiderReq = await RiderEntryRequest.create(riderEntries);

        resolve({ entry, riders, newRiderReq, riderIDS });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * dispatch entry to exalt riders silent for
   * enterprise shipment that goes to exalt logistics
   * @param {Object} entry
   */
  silentlyAsignRiderToEntry(entry) {
    return new Promise(async (resolve, reject) => {
      try {
        // find all the online riders for the company with the specific vehicle type
        const riders = await Rider.find({
          company: entry.company,
          deleted: false,
          onlineStatus: true,
          status: "active",
          verified: true,
          vehicle: entry.vehicle,
        });

        console.log("riders", riders);

        if (typeof riders[0] === "undefined") {
          resolve({ riderIDS: null });
          return;
        }

        const riderIDS = [];
        const riderEntries = [];
        await AsyncForEach(riders, async (row, index, arr) => {
          riderIDS.push(row._id);
          riderEntries.push({
            entry: entry._id,
            company: entry.company,
            rider: row._id,
          });
        });

        console.log("riderIDS", riderIDS);

        const newRiderReq = await RiderEntryRequest.create(riderEntries);

        resolve({ riders, newRiderReq, riderIDS });
      } catch (error) {
        // console.log("error", error);
        resolve({ riderIDS: null });
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
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const currentDate = new Date();

        const rider = await Rider.findOne({
          _id: user.id,
          status: "active",
          onlineStatus: true,
          verified: true,
        }).lean();
        if (!rider) {
          reject({ code: 404, msg: "You can't accept this order" });
          return;
        }

        const company = await Company.findOne({
          _id: rider.company,
          status: "active",
          verified: true,
        }).lean();

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

        await entry.updateOne(
          {
            rider: user.id,
            riderAcceptedAt: currentDate,
            status: "driverAccepted",
          },
          { session }
        );

        await Order.updateMany(
          { entry: body.entry },
          { rider: user.id },
          { session }
        );

        await reqEntry.updateOne({ status: "accepted" }, { session });

        await transaction.updateOne({ rider: user.id }, { session });

        const logs = {
          type: "driverAccepted",
          order: entry.orders,
          rider: rider._id,
          user: entry.user,
          entry: entry._id,
          latitude: rider.latitude,
          longitude: rider.longitude,
          metaData: {},
        };

        const tripLogInstance = new TripLogService();
        await tripLogInstance.createLog(logs, session);

        await session.commitTransaction();
        session.endSession();

        await RiderEntryRequest.updateMany(
          {
            status: "pending",
            entry: body.entry,
          },
          {
            status: "declined",
          }
        );

        resolve({ entry, reqEntry, rider });
      } catch (error) {
        await session.abortTransaction();
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
        reject(error);
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
          reject({ code: 404, msg: "The account provided is not valid" });
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
        })
          .lean()
          .select("-metaData");

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }

        //check that there are no instant pickup that needs to be deliveried first
        await this.instantEntries(rider._id, entry);

        await Entry.updateOne(
          { _id: body.entry },
          { status: "enrouteToPickup" },
          { session }
        );
        // update all order status
        await Order.updateMany(
          { entry: entry._id },
          { status: "enrouteToPickup" },
          { session }
        );

        const logs = {
          type: "enrouteToPickup",
          order: entry.orders,
          rider: rider._id,
          user: entry.user,
          entry: entry._id,
          latitude: rider.latitude,
          longitude: rider.longitude,
          metaData: {},
        };
        // log trip status
        const tripLogInstance = new TripLogService();
        await tripLogInstance.createLog(logs, session);

        await session.commitTransaction();
        session.endSession();

        // resolve(entry);
        resolve({ entry, rider, company });
      } catch (error) {
        console.log("error service", error);
        await session.abortTransaction();
        reject(error);
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

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "enrouteToPickup",
          company: company._id,
          rider: rider._id,
        })
          .lean()
          .select("-metaData");

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }

        //check that there are no instant pickup that needs to be deliveried first
        await this.instantEntries(rider._id, entry);

        const token = GenerateOTP(4);

        // update the status to delivery updated
        await Entry.updateOne(
          { _id: body.entry },
          { status: "arrivedAtPickup", OTPCode: token },
          { session }
        );
        // update all order status
        await Order.updateMany(
          { entry: entry._id },
          { status: "arrivedAtPickup" },
          {
            session,
          }
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
        if (entryUser.email !== entry.email) {
          Mailer(entryUser.email, subject, html);
          const toUser = entryUser.countryCode + entryUser.phoneNumber;
          await notifyInstance.sendOTPByTermii(msg, toUser);
        }

        const logs = {
          type: "arrivedAtPickup",
          order: entry.orders,
          rider: rider._id,
          user: entry.user,
          entry: entry._id,
          latitude: rider.latitude,
          longitude: rider.longitude,
          metaData: {
            OTPCode: token,
          },
        };
        const tripLogInstance = new TripLogService();
        await tripLogInstance.createLog(logs, session);

        await session.commitTransaction();
        session.endSession();

        resolve({ entry, rider, company, user });
      } catch (error) {
        console.log("error", error);
        await session.abortTransaction();
        reject(error);
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

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "arrivedAtPickup",
          company: company._id,
          rider: rider._id,
        })
          .lean()
          .select("-metaData");

        if (!entry) {
          reject({ code: 404, msg: "This entry doesn't exist" });
          return;
        }

        // check if the payment method is cash
        if (entry.paymentMethod !== "cash") {
          reject({
            code: 400,
            msg: "You can't approve a entry that isn't a cash payment",
          });
          return;
        }
        if (entry.cashPaymentType !== "pickup") {
          return reject({
            code: 400,
            msg: "You can't confirm cash payment for this order at pickup",
          });
        }

        const transactionsFilter = {
          entry: body.entry,
          paymentMethod: "cash",
          status: "pending",
        };

        const transactions = await Transaction.find(transactionsFilter);

        if (!transactions.length) {
          reject({
            code: 404,
            msg: "No Transaction was found for this entry",
          });
          return;
        }

        const logs = {
          type: "confirmPayment",
          order: entry.orders,
          rider: rider._id,
          user: entry.user,
          entry: entry._id,
          latitude: rider.latitude,
          longitude: rider.longitude,
          metaData: {},
        };

        // when rider select declined on payment status
        if (body.status === "declined") {
          await Transaction.updateMany(
            transactionsFilter,
            { status: "declined" },
            { session }
          );
          await Entry.updateOne(
            { _id: body.entry },
            {
              status: "cancelled",
              cancelledAt: new Date(),
            },
            { session }
          );
          await Order.updateMany(
            { entry: entry._id },
            { status: "cancelled", cancelledAt: new Date() },
            { session }
          );

          logs.type = "cancelled";
          const tripLogInstance = new TripLogService();
          await tripLogInstance.createLog(logs, session);

          await session.commitTransaction();
          session.endSession();

          resolve({
            entry,
            rider,
            company,
            transactions,
            code: 200,
            msg:
              "You've successfully declined this payment and the order has been cancelled for this trip.",
          });
          return;
        } else {
          const currentDate = new Date();
          await Transaction.updateMany(
            transactionsFilter,
            {
              status: "approved",
              approvedAt: currentDate,
            },
            { session }
          );

          const tripLogInstance = new TripLogService();
          await tripLogInstance.createLog(logs, session);

          await session.commitTransaction();
          session.endSession();

          resolve({
            entry,
            rider,
            company,
            transactions,
            code: 200,
            msg: "Payment has been approved successfully.",
          });
        }
      } catch (error) {
        await session.abortTransaction();
        reject(error);
      }
    });
  }

  /**
   * Rider confirm user cash payment at a delivery location
   * @param {Object} body
   * @param {Auth User} user
   */
  riderConfirmCashPaymentAtDelivery(body, user) {
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

        // check if correct order exists
        const order = await Order.findOne({
          _id: body.order,
          status: "arrivedAtDelivery",
          company: company._id,
          rider: rider._id,
        })
          .lean()
          .populate("entry")
          .select("-metaData");

        if (!order) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }

        // check if the payment method is cash
        if (order.paymentMethod !== "cash") {
          reject({
            code: 400,
            msg: "You can't approve an order that isn't a cash payment",
          });
          return;
        }
        if (order.cashPaymentType !== "delivery") {
          return reject({
            code: 400,
            msg: "You can't confirm cash payment for this order at delivery",
          });
        }

        const transactionFilter = {
          order: body.order,
          paymentMethod: "cash",
          status: "pending",
        };

        const transaction = await Transaction.findOne(transactionFilter);

        if (!transaction) {
          return reject({
            code: 404,
            msg: "No Transaction was found for this order",
          });
        }

        const logs = {
          type: "confirmPayment",
          order: order._id,
          rider: rider._id,
          user: order.entry.user,
          entry: order.entry._id,
          latitude: rider.latitude,
          longitude: rider.longitude,
          metaData: {},
        };

        // when rider select declined on payment status
        if (body.status === "declined") {
          await Transaction.updateOne(
            transactionFilter,
            { status: "declined" },
            { session }
          );
          await Order.updateOne(
            { _id: order._id },
            {
              status: "cancelled",
              cancelledAt: new Date(),
            },
            { session }
          );
          // await Order.updateMany(
          //   { entry: entry._id },
          //   { status: "cancelled", cancelledAt: new Date() },
          //   { session }
          // );

          logs.type = "cancelled";
          const tripLogInstance = new TripLogService();
          await tripLogInstance.createLog(logs, session);

          await session.commitTransaction();
          session.endSession();

          resolve({
            entry: order.entry,
            rider,
            company,
            transaction,
            code: 200,
            msg:
              "You've successfully declined this payment and the order has been cancelled for this trip.",
          });
          return;
        } else {
          const currentDate = new Date();
          await Transaction.updateOne(
            transactionFilter,
            {
              status: "approved",
              approvedAt: currentDate,
            },
            { session }
          );

          const tripLogInstance = new TripLogService();
          await tripLogInstance.createLog(logs, session);

          await session.commitTransaction();
          session.endSession();

          resolve({
            entry: order.entry,
            rider,
            company,
            transaction,
            code: 200,
            msg: "Payment has been approved successfully.",
          });
        }
      } catch (error) {
        console.log("Error => ", error);
        await session.abortTransaction();
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
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

        // check if the entry has not been taken by another rider
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "arrivedAtPickup",
          company: company._id,
          rider: rider._id,
        })
          .lean()
          .select("-metaData");

        if (!entry) {
          reject({ code: 404, msg: "This order doesn't exist" });
          return;
        }

        //check that there are no instant pickup that needs to be deliveried first
        await this.instantEntries(rider._id, entry);

        // check if the payment method is cash and cashPaymenType is 'pickup'
        if (
          entry.paymentMethod === "cash" &&
          entry.cashPaymentType === "pickup"
        ) {
          const transactions = await Transaction.find({ entry: body.entry });
          if (!transactions.length) {
            reject({
              code: 404,
              msg: "No Transaction was found for this entry",
            });
            return;
          }

          if (transactions[0].status !== "approved") {
            reject({
              code: 400,
              msg: `You need to confirm payment before confirming pickup.`,
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
          await Entry.updateOne(
            { _id: body.entry },
            {
              $push: { OTPRecord: data },
            }
          );

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
        await Entry.updateOne(
          { _id: body.entry },
          { status: "pickedup", OTPCode: null },
          { session }
        );
        // update all order status
        await Order.updateMany(
          { entry: entry._id },
          { status: "pickedup" },
          { session }
        );

        const logs = {
          type: "pickedup",
          order: entry.orders,
          rider: rider._id,
          user: entry.user,
          entry: entry._id,
          latitude: rider.latitude,
          longitude: rider.longitude,
          metaData: {},
        };
        const tripLogInstance = new TripLogService();
        await tripLogInstance.createLog(logs, session);

        await session.commitTransaction();
        session.endSession();

        resolve({ entry, rider, company, user });
      } catch (error) {
        await session.abortTransaction();
        reject(error);
      }
    });
  }

  /**
   * Check instant pickup
   * @param {ObjectId} rider
   */
  instantEntries(rider, entry) {
    return new Promise(async (resolve, reject) => {
      try {
        // find instant entry
        const instantEntries = await Entry.countDocuments({
          rider,
          pickupType: "instant",
          $or: [
            { status: "driverAccepted" },
            { status: "enrouteToPickup" },
            { status: "arrivedAtPickup" },
            { status: "pickedup" },
            { status: "enrouteToDelivery" },
            { status: "arrivedAtDelivery" },
          ],
        });

        // check if the instant entries are more than one
        if (instantEntries >= 1) {
          // check if the rider is triggering a instant pickup type
          if (entry.pickupType !== "instant") {
            reject({
              code: 400,
              msg: "You need to start an instant pickup first.",
            });
            return;
          }
        }

        resolve();
      } catch (error) {
        reject({
          code: 400,
          msg: "You need to start an instant pickup first.",
        });
      }
    });
  }

  /**
   * Update Mutiple Entries
   * @param {Object} filter
   * @param {Object} set
   */
  updateAll(filter = {}, set = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const updateResult = await Entry.updateMany(filter, set);

        resolve(updateResult);
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  getBulkShipments(enterpriseId, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try{
        const filter = {
          enterprise: enterpriseId,
          shipment: { $ne : null }
        };

        const entries = await Entry.find(filter)
        .populate("orders")
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: "desc" });

        const total = await Entry.countDocuments(filter);

        resolve({entries, total});
      } catch(error){
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    })
  }
}

module.exports = EntryService;

// send the request to the driver
// const newRiderReq = new RiderEntryRequest({
//   entry: entry._id,
//   company: company._id,
//   rider: body.rider,
// });

// await newRiderReq.save();
