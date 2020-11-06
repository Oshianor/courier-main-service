const config = require("config");
const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { DistancePrice, validateDistancePrice } = require("../../models/distancePrice");
const { MSG_TYPES } = require("../../constant/types");
const { Country } = require("../../models/countries");

exports.distancePrice = async (req, res) => {
  try {
    // validate request
    const { error } = validateDistancePrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    const dp = await DistancePrice.findOne({ country: req.body.country, state: req.body.state });
    if (dp) return JsonResponse(res, 400, "Record already exsit for this country and state.", null, null);

    // create new record
    const newDP = new DistancePrice(req.body);
    await newDP.save();

    JsonResponse(res, 200, MSG_TYPES.CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
