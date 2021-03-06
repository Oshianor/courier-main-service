const config = require("config");
const paystack = require("paystack")(config.get("paystack.secret"));
const mongoose = require("mongoose");
const moment = require("moment");
const objectPath = require("object-path");
const service = require("../services");
const { Company } = require("../models/company");
const { Entry, validateLocalEntry } = require("../models/entry");
const { Order } = require("../models/order");
const { Rider } = require("../models/rider");
const { Country } = require("../models/countries");
const { Setting } = require("../models/settings");
const { DistancePrice } = require("../models/distancePrice");
const {
  Transaction,
  validateTransaction,
  validateTransactionStatus,
} = require("../models/transaction");
const { Client } = require("@googlemaps/google-maps-services-js");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { AsyncForEach, paginate } = require("../utils");
const { nanoid } = require("nanoid");
const { Pricing } = require("../models/pricing");
const client = new Client({});

/**
 * Create an Entry
 * @param {*} req
 * @param {*} res
 */
exports.localEntry = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { error } = validateLocalEntry(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // validate country and state
    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    // check if we have pricing for the location
    const distancePrice = await DistancePrice.findOne({
      country: req.body.country,
      state: req.body.state,
      vehicle: req.body.vehicle,
    });
    if (!distancePrice)
      return JsonResponse(res, 404, MSG_TYPES.FAILED_SUPPORT, null, null);

    // get admin settings pricing
    const setting = await Setting.findOne({ source: "admin" });
    if (!setting)
      return JsonResponse(res, 404, MSG_TYPES.FAILED_SUPPORT, null, null);

    // get all coords locations and sort them.
    const origins = [
      { lat: req.body.pickupLatitude, lng: req.body.pickupLongitude },
    ];
    const destinations = [];
    // get all origin and destination
    await AsyncForEach(req.body.delivery, (data, index, arr) => {
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

    const data = distance.data;
    req.body.TED = 0;
    req.body.TET = 0;
    req.body.TEC = 0;
    req.body.user = req.user.id;
    req.body.pickupAddress = data.origin_addresses[0];
    req.body.metaData = {
      distance: data,
      distancePrice,
      setting,
    };
    // get item type price
    let itemTypePrice = 0;
    if (req.body.itemType === "Document") {
      itemTypePrice = setting.documentPrice;
    } else if (req.body.itemType === "Edible") {
      itemTypePrice = setting.ediblePrice;
    } else {
      itemTypePrice = setting.parcelPrice;
    }

    await AsyncForEach(data.rows, async (row, rowIndex, rowsArr) => {
      await AsyncForEach(row.elements, (element, elemIndex, elemArr) => {
        if (element.status === "OK") {
          const time = parseFloat(element.duration.value / 60);
          const singleDistance = parseFloat(element.distance.value / 1000);
          // add user id
          req.body.delivery[elemIndex].user = req.user.id;

          // orderId
          req.body.delivery[elemIndex].orderId = nanoid(10);
          // add the pickup
          // add delivery address in text
          req.body.delivery[elemIndex].deliveryAddress =
            data.destination_addresses[elemIndex];
          // add pickup details for each order
          req.body.delivery[elemIndex].pickupLatitude = req.body.pickupLatitude;
          req.body.delivery[elemIndex].pickupLongitude =
            req.body.pickupLongitude;
          req.body.delivery[elemIndex].pickupAddress = data.origin_addresses[0];
          // set duration of an order from the pick up point to the delivery point
          req.body.delivery[elemIndex].estimatedTravelduration = time;
          // set distance of an order from the pick up point to the delivery point
          req.body.delivery[elemIndex].estimatedDistance = singleDistance;

          // total the distance travelled and time
          req.body.TET = req.body.TET + time;
          req.body.TED = req.body.TED + singleDistance;

          // estimated cost
          // calculate the km travelled for each trip multiplied by our price per km
          const km =
            parseFloat(singleDistance) * parseFloat(distancePrice.price);
          // calculate the weight of each order for each trip multiplied by our price per weight
          const weight =
            parseFloat(req.body.delivery[elemIndex].weight) *
            parseFloat(setting.weightPrice);
          const amount =
            parseFloat(km) +
            parseFloat(weight) +
            parseFloat(itemTypePrice) +
            parseFloat(setting.baseFare);

          // set price for each order
          req.body.delivery[elemIndex].estimatedCost = parseFloat(amount);
          // parseFloat(km) + parseFloat(weight) + parseFloat(setting.baseFare);

          // set total price for the entry
          req.body.TEC = req.body.TEC + parseFloat(amount);
        } else {
          // very questionable
          // just for test only
          delete req.body.delivery[elemIndex];
        }
      });
    });

    // console.log("req.body", req.body);

    // start our mongoDb transaction
    session.startTransaction();

    const newEntry = new Entry(req.body);
    await AsyncForEach(req.body.delivery, async (row, index, arr) => {
      req.body.delivery[index].entry = newEntry._id;
    });
    const newOrder = await Order.create(req.body.delivery, {
      session: session,
    });

    // console.log("newOrder", newOrder);
    newEntry.orders = newOrder;
    req.body.orders = newEntry.orders;
    await newEntry.save({ session: session });

    await session.commitTransaction();
    session.endSession();

    objectPath.del(newEntry, "orders");
    JsonResponse(res, 201, MSG_TYPES.ORDER_POSTED, newEntry, null);
    return;
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * User confirm payment method and entry
 * @param {*} req
 * @param {*} res
 */
exports.transaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { error } = validateTransaction(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const entry = await Entry.findOne({
      _id: req.body.entry,
      status: "request",
      user: req.user.id,
    });
    if (!entry) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    let msgRES;
    if (req.body.paymentMethod === "card") {
      const card = await service.user.getCard(req.token, req.body.card);

      const trans = await paystack.transaction.charge({
        reference: nanoid(20),
        authorization_code: card.token,
        // email: req.user.email,
        email: "abundance@gmail.com",
        amount: entry.TEC,
      });

      console.log("trans", trans);

      const msg = "Your Transaction could't be processed at the moment";
      if (!trans.status) return JsonResponse(res, 404, msg, null, null);
      if (trans.data.status !== "success")
        return JsonResponse(res, 404, msg, null, null);

      req.body.amount = entry.TEC;
      req.body.user = req.user.id;
      req.body.status = "approved";
      req.body.approvedAt = new Date();
      req.body.entry = entry;
      req.body.txRef = trans.data.reference;

      msgRES = "Payment Successfully Processed";
    } else {
      req.body.amount = entry.TEC;
      req.body.user = req.user.id;
      req.body.status = "pending";
      req.body.entry = entry;
      req.body.txRef = nanoid(10);

      msgRES = "Cash Payment Method Confirmed";
    }

    // start our transaction

    session.startTransaction();

    const newTransaction = new Transaction(req.body);

    // console.log("newOrder", newOrder);
    entry.transaction = newTransaction;
    entry.status = "pending";
    await newTransaction.save({ session: session });
    await entry.save({ session: session });

    await session.commitTransaction();
    session.endSession();

    JsonResponse(res, 201, msgRES, null, null);
    return;
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Rider confirm user cash payment
 * @param {*} req
 * @param {*} res
 */
exports.riderConfirmPayment = async (req, res) => {
  try {
    const { error } = validateTransactionStatus(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // find the rider
    const rider = await Rider.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
      company: { $ne: null },
    });
    if (!rider) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    // find the company
    const company = await Company.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    const entry = await Entry.findOne({
      status: "accepted",
      rider: rider._id,
      company: company._id,
    });
    if (!entry) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    const trans = await Transaction.findOne({
      entry: entry._id,
    });
    if (!trans) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    let msgRES;
    if (req.body.status === "approved") {
      await trans.updateOne({ status: "approved", approvedAt: new Date() });
      msgRES = "Payment Approved.";
    } else {
      await trans.updateOne({ status: "declined", approvedAt: new Date() });
      await entry.updateOne({ status: "cancelled", cancelledAt: new Date() });
      msgRES = "Payment Declined and Order cancelled.";
    }

    JsonResponse(res, 200, msgRES, null, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * get entries by a company
 * @param {*} req
 * @param {*} res
 */
exports.byCompany = async (req, res) => {
  try {
    //get pagination value
    const { page, pageSize, skip } = paginate(req);

    const company = await Company.findOne({
      _id: req.user.id,
      $or: [{ status: "active" }, { status: "inactive" }],
      verified: true,
    });
    if (!company) JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    const entries = await Entry.find({
      source: "pool",
      state: company.state,
      // company: null
    })
      .skip(skip)
      .limit(pageSize)
      .select("-metaData");

    const total = await Entry.find({
      source: "pool",
      state: company.state,
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, entries, meta);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};

/**
 * Get a single entry
 * @param {*} req
 * @param {*} res
 */
exports.singleEntry = async (req, res) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id })
      .populate("orders")
      .select("-metaData");

    if (!entry) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, entry, null);
    return;
  } catch (error) {
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};

/**
 * Get all online riders for a company by an entry
 * @param {*} req
 * @param {*} res
 */
exports.allOnlineRiderCompanyEntry = async (req, res) => {
  try {
    // find an entry that as been assigned to the company
    const entry = await Entry.findOne({
      _id: req.params.entry,
      status: "companyAccepted",
      company: req.user.id,
    });
    if (!entry) return JsonResponse(res, 404, "Entry Not Found!", null, null);

    const company = await Company.findOne({
      _id: req.user.id,
      $or: [{ status: "active" }, { status: "inactive" }],
      verified: true,
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    console.log("entry.vehicle", entry.vehicle);
    console.log("company._id", company._id);
    const riders = await Rider.find({
      company: company._id,
      deleted: false,
      onlineStatus: true,
      status: "active",
      verified: true,
      vehicle: entry.vehicle,
    })
      .populate("vehicle")
      .select("name email phoneNumber state country vehicle");

    JsonResponse(res, 200, MSG_TYPES.FETCHED, riders, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Company accept Entry
 * @param {*} req
 * @param {*} res
 */
exports.companyAcceptEntry = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.user.id,
      $or: [{ status: "active" }, { status: "inactive" }],
      verified: true,
    });
    if (!company)
      return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    const entry = await Entry.findOne({
      _id: req.params.entry,
      status: "pending",
      company: null,
    });
    if (!entry) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    if (!company.vehicles.includes(entry.vehicle))
      return JsonResponse(
        res,
        404,
        "You currently don't have support for this vehicle Type so you can't accept this order.",
        null,
        null
      );

    await entry.updateOne({
      company: req.user.id,
      companyAcceptedAt: new Date(),
      status: "companyAccepted",
    });

    JsonResponse(
      res,
      200,
      "You've successfully accepted this Order. Please Asign a rider to this order immedaitely.",
      null,
      null
    );
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
