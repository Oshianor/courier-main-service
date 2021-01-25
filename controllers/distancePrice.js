const config = require("config");
const Admin = require("../models/admin");
const Country = require("../models/countries");
const Vehicle = require("../models/vehicle");
const Company = require("../models/company");
const DistancePrice = require("../models/distancePrice");
const {
  validateDistancePrice,
  validateDistancePriceCompany,
  validateUpdateDistancePrice,
} = require("../request/distancePrice");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");


/**
 * Create DP for admin
 * @param {*} req
 * @param {*} res
 */
exports.admin = async (req, res, next) => {
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

    const dp = await DistancePrice.findOne({
      country: req.body.country,
      state: req.body.state,
      vehicle: req.body.vehicle,
      source: "admin",
    });
    if (dp)
      return JsonResponse(
        res,
        400,
        "Record already exsit for this country, state and vehicle.",
        null,
        null
      );

    // create new record
    req.body.source = "admin";
    const newDP = new DistancePrice(req.body);
    await newDP.save();

    JsonResponse(res, 200, MSG_TYPES.CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    next(error);
    return;
  }
};

/**
 * Create DP for company
 * @param {*} req
 * @param {*} res
 */
exports.company = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateDistancePriceCompany(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const company = await Company.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
      deleted: false,
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found", null, null);

    const vehicle = await Vehicle.findOne({ _id: req.body.vehicle });
    if (!vehicle)
      return JsonResponse(res, 404, "Vehicle Not Found", null, null);

    const dp = await DistancePrice.findOne({
      country: company.country,
      state: company.state,
      vehicle: req.body.vehicle,
      company: req.user.id,
    });
    if (dp)
      return JsonResponse(
        res,
        400,
        "Record already exsit for this country, state and vehicle.",
        null,
        null
      );

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
    next(error);
    return;
  }
};

/**
 * Get DP for admin
 * @param {*} req
 * @param {*} res
 */
exports.getAdmin = async (req, res, next) => {
  try {
    const page =
      typeof req.query.page !== "undefined" ? Math.abs(req.query.page) : 1;
    const pageSize =
      typeof req.query.pageSize !== "undefined" ? Math.abs(req.query.page) : 50;
    const skip = (page - 1) * pageSize;
    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    const dp = await DistancePrice.find()
      .populate("vehicle")
      .skip(skip)
      .limit(pageSize);
    const total = await DistancePrice.find().countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, dp, meta);
    return;
  } catch (error) {
    console.log(error);
    next(error);
    return;
  }
};

/**
 * Get DP for Company
 * @param {*} req
 * @param {*} res
 */
exports.getCompany = async (req, res, next) => {
  try {
    const page =
      typeof req.query.page !== "undefined" ? Math.abs(req.query.page) : 1;
    const pageSize =
      typeof req.query.pageSize !== "undefined" ? Math.abs(req.query.page) : 50;
    const skip = (page - 1) * pageSize;
    // check if account exist

    const company = await Company.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
      deleted: false,
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found", null, null);

    const dp = await DistancePrice.find({
      source: "company",
      company: req.user.id,
    })
      .populate("vehicle")
      .skip(skip)
      .limit(pageSize);
    const total = await DistancePrice.find({
      source: "company",
      company: req.user.id,
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, dp, meta);
    return;
  } catch (error) {
    console.log(error);
    next(error);
    return;
  }
};

/**
 * Update DP for Admin
 * @param {*} req
 * @param {*} res
 */
exports.updateAdmin = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateUpdateDistancePrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const dp = await DistancePrice.findOne({
      _id: req.params.dp,
      source: "admin",
    });
    if (!dp) return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    await dp.updateOne(req.body);

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    next(error);
    return;
  }
};

/**
 * Update DP for Company
 * @param {*} req
 * @param {*} res
 */
exports.updateCompany = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateUpdateDistancePrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const company = await Company.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
      deleted: false,
    });
    if (!company)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const dp = await DistancePrice.findOne({
      _id: req.params.dp,
      source: "company",
      company: req.user.id,
    });
    if (!dp) return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    await dp.updateOne(req.body);

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    next(error);
    return;
  }
};

/**
 * Delete DP for Admin
 * @param {*} req
 * @param {*} res
 */
exports.deleteAdmin = async (req, res, next) => {
  try {
    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const dp = await DistancePrice.findOne({
      _id: req.params.dp,
      source: "admin",
    });
    if (!dp) return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    await dp.deleteOne();

    JsonResponse(res, 200, MSG_TYPES.DELETED, null, null);
    return;
  } catch (error) {
    console.log(error);
    next(error);
    return;
  }
};

/**
 * Delete DP for Company
 * @param {*} req
 * @param {*} res
 */
exports.deleteCompany = async (req, res, next) => {
  try {
    // check if account exist
    const company = await Company.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
      deleted: false,
    });
    if (!company)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const dp = await DistancePrice.findOne({
      _id: req.params.dp,
      company: req.user.id,
      source: "company",
    });
    if (!dp) return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    await dp.deleteOne();

    JsonResponse(res, 200, MSG_TYPES.DELETED, null, null);
    return;
  } catch (error) {
    console.log(error);
    next(error);
    return;
  }
};