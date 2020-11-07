const config = require("config");
const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { DistancePrice, validateDistancePrice, validateDistancePriceCompany } = require("../../models/distancePrice");
const { MSG_TYPES } = require("../../constant/types");
const { Country } = require("../../models/countries");
const { Vehicle } = require("../../models/vehicle");
const { Company } = require("../../models/company");

exports.admin = async (req, res) => {
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

    const vehicle = await Vehicle.findOne({ _id: req.body.vehicle });
    if (!vehicle)
      return JsonResponse(res, 404, "Vehicle Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    const dp = await DistancePrice.findOne({ country: req.body.country, state: req.body.state, vehicle: req.body.vehicle, source: "admin" });
    if (dp) return JsonResponse(res, 400, "Record already exsit for this country, state and vehicle.", null, null);

    // create new record
    req.body.source = "admin";
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


exports.company = async (req, res) => {
  try {
    // validate request
    const { error } = validateDistancePriceCompany(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const company = await Company.findOne({ _id: req.user.id, status: "active", verified: true, deleted: false });
    if (!company) return JsonResponse(res, 404, "Company Not Found", null, null);

    const vehicle = await Vehicle.findOne({ _id: req.body.vehicle });
    if (!vehicle)
      return JsonResponse(res, 404, "Vehicle Not Found", null, null);

    const dp = await DistancePrice.findOne({
      country: company.country,
      state: company.state,
      vehicle: req.body.vehicle,
      company: req.user.id,
    });
    if (dp) return JsonResponse(res, 400, "Record already exsit for this country, state and vehicle.", null, null);

    // create new record
    req.body.source = "company";
    req.body.company = company._id;
    req.body.organization = company.organization;
    req.body.country = company.country;
    req.body.state = company.state;
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
