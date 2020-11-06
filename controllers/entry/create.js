const { Company, validateCompany } = require("../../models/company");
const { Entry, validateLocalEntry } = require("../../models/entry");
const { Order } = require("../../models/order");
const { Country } = require("../../models/countries");
const { Setting } = require("../../models/settings");
const { DistancePrice } = require("../../models/distancePrice");
const { Client } = require("@googlemaps/google-maps-services-js");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { UploadFileFromBinary, Mailer, AsyncForEach, eventEmitter } = require("../../utils");
const { Verification } = require("../../templates");
const moment = require("moment");
const config = require("config");
const { nanoid } = require("nanoid");
const mongoose = require("mongoose");
const client = new Client({});
/**
 * Create an Entry
 * @param {*} req
 * @param {*} res
 */

exports.localEntry = async (req, res) => {
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
    });
    if (!distancePrice) return JsonResponse(res, 404, MSG_TYPES.FAILED_SUPPORT, null, null); 


    // get admin settings pricing
    const setting = await Setting.findOne({ source: "admin" });
    if (!setting) return JsonResponse(res, 404, MSG_TYPES.FAILED_SUPPORT, null, null);


    // get all coords locations and sort them.
    const origins = [{ lat: req.body.pickupLatitude, lng: req.body.pickupLongitude }];
    const destinations = [];
    // get all origin and destination
    await AsyncForEach(req.body.delivery, (data, index, arr) => {
      destinations.push({ lat: data.deliveryLatitude, lng: data.deliveryLongitude });
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
    req.body.metaData = data;
    // get item type price
    let itemTypePrice = 0
    if (req.body.itemType === "Document") {
      itemTypePrice = setting.documentPrice;
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
          req.body.delivery[elemIndex].deliveryAddress = data.destination_addresses[elemIndex];
          // add pickup details for each order
          req.body.delivery[elemIndex].pickupLatitude = req.body.pickupLatitude
          req.body.delivery[elemIndex].pickupLongitude = req.body.pickupLongitude
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
          const km = singleDistance * parseFloat(distancePrice.price);
          // calculate the weight of each order for each trip multiplied by our price per weight
          const weight = req.body.delivery[elemIndex].weight * setting.weightPrice;
          const amount = parseFloat(km) + parseFloat(weight) + parseFloat(itemTypePrice)

          // set price for each order
          req.body.delivery[elemIndex].estimatedCost = parseFloat(km) + parseFloat(weight);

          // set total price for the entry
          req.body.TEC = req.body.TEC + parseFloat(amount);
        } else {
          // very questionable
          // just for test only
          delete req.body.delivery[elemIndex];
        }
      });
    });

    console.log("req.body", req.body);

    // start our transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const newEntry = new Entry(req.body);
    await AsyncForEach(req.body.delivery, async (row, index, arr) => {
      req.body.delivery[index].entry = newEntry._id;
    });
    const newOrder = await Order.create(req.body.delivery, { session: session });

    // console.log("newOrder", newOrder);
    newEntry.orders = newOrder;
    req.body.orders = newEntry.orders;
    await newEntry.save({ session: session });


    //emit event to trigger addToPool using websocket
    eventEmitter.emit("newEntry", newEntry, newOrder);

    await session.commitTransaction();
    session.endSession();

    JsonResponse(res, 201, MSG_TYPES.ORDER_POSTED, newEntry, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};



// await AsyncForEach(req.body.delivery, (data, index, arr) => {
//   const len = arr.length - 1;
//   // // don't push the last address
//   if (len !== pos) {
//     origins.push({ lat: data.latitude, lng: data.longitude });
//   }
//   destinations.push({ lat: data.latitude, lng: data.longitude });
//   pos = pos + 1;
// });