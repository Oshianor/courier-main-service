const { Company } = require("../../models/company");
const { Entry, validateLocalEntry } = require("../../models/entry");
const { Order } = require("../../models/order");
const { Rider } = require("../../models/rider");
const { Country } = require("../../models/countries");
const { Setting } = require("../../models/settings");
const { DistancePrice } = require("../../models/distancePrice");
const {
  Transaction,
  validateTransaction,
  validateTransactionStatus,
} = require("../../models/transaction");
const { Client } = require("@googlemaps/google-maps-services-js");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const {
  UploadFileFromBinary,
  Mailer,
  AsyncForEach,
  eventEmitter,
} = require("../../utils");
const { Verification } = require("../../templates");
const service = require("../../services");
const moment = require("moment");
const config = require("config");
const { nanoid } = require("nanoid");
const mongoose = require("mongoose");
const client = new Client({});
const paystack = require("paystack")(config.get("paystack.secret"));





/**
 * Company accept Entry
 * @param {*} req
 * @param {*} res
 */
exports.companyAcceptEntry = async (req, res) => {
  try {

    const company = await Company.findOne({ _id: req.user.id, $or: [{status: "active"}, {status: "inactive"}], verified: true });
    if (!company) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    const entry = await Entry.findOne({
      _id: req.params.entry,
      status: "pending",
      company: null
    });
    if (!entry) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    if (!company.vehicles.includes(entry.vehicle)) return JsonResponse(res, 404, "You currently don't have support for this vehicle Type so you can't accept this order.", null, null);

    await entry.updateOne({
      company: req.user.id,
      companyAcceptedAt: new Date(),
      status: "companyAccepted",
    }); 

    JsonResponse(res, 200, "You've successfully accepted this Order. Please Asign a rider to this order immedaitely.", null, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
