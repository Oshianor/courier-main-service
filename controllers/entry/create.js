const { Company, validateCompany } = require("../../models/company");
const { Entry, validateLocalEntry } = require("../../models/entry");
const { Order } = require("../../models/order");
const { Country } = require("../../models/countries");
const { Client } = require("@googlemaps/google-maps-services-js");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { UploadFileFromBinary, Mailer, AsyncForEach } = require("../../utils");
const { Verification } = require("../../templates");
const moment = require("moment");
const nanoid = require("nanoid");
const config = require("config");
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

    // get all coords locations and sort them.
    const origins = [{ lat: req.body.latitude, lng: req.body.longitude }];
    const destinations = [];
    let pos = 0;
    AsyncForEach(req.body.delivery, async (data, index, arr) => {
      console.log("arr.length", arr.length);
      console.log("pos", pos);
      pos = pos + 1;
      const len = arr.length -1;
      // don't push the last address
      if (len !== pos) {
        origins.push({ lat: data.latitude, lng: data.longitude });
      }
      destinations.push({ lat: data.latitude, lng: data.longitude });
    });

    // get
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




    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, distance.data, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
