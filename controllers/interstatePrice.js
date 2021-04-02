const { validateInterstatePrice, validateUpdateInterstatePrice, validateCompanyInterstatePrice, validateUpdateCompanyInterstatePrice } = require("../request/interstatePrice");
const { MSG_TYPES } = require("../constant/types");
const { JsonResponse } = require("../lib/apiResponse");
const model = require('../models/interstatePrice')
const interstatePriceService = require("../services/interstatePriceService")


exports.create = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateInterstatePrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const interStateInstance = new interstatePriceService();
    await interStateInstance.create(req.body)
    return JsonResponse(res, 200, MSG_TYPES.CREATED);
  } catch (error) {
    next(error);

  }
};

exports.createCompanyInterstatePrice = async (req, res, next) => {
  try {
    //validate request
    const { error } = validateCompanyInterstatePrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const interStateInstance = new interstatePriceService();
    await interStateInstance.createCompanyInterstatePrice(req.query.id, req.body)
    return JsonResponse(res, 200, MSG_TYPES.CREATED);
  } catch (error) {
    next(error);

  }
};


exports.getAll = async (req, res, next) => {
  try {
    const interStateInstance = await model.find({})

    return JsonResponse(res, 200, MSG_TYPES.FETCHED, interStateInstance);
  } catch (error) {
    next(error);

  }
};


exports.getAllCompanyInterstatePrice = async (req, res, next) => {
  try {
    const interStateInstance = await model.find({ "company": req.query.id })

    return JsonResponse(res, 200, MSG_TYPES.FETCHED, interStateInstance);
  } catch (error) {
    next(error);

  }
};

exports.getById = async (req, res, next) => {
  try {
    const interStateInstance = new interstatePriceService()
    let data = await interStateInstance.getById(req.query.id)
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, data);
  } catch (error) {
    next(error);

  }
};

exports.getCompanyInterStatePriceById = async (req, res, next) => {
  try {
    const interStateInstance = new interstatePriceService()
    let data = await interStateInstance.getCompanyInterStatePriceById(req.query.id, req.body)
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, data);
  } catch (error) {
    next(error);

  }
};

exports.delete = async (req, res, next) => {
  try {
    const interStateInstance = new interstatePriceService()
    let data = await interStateInstance.delete(req.query.id)
    return JsonResponse(res, 200, MSG_TYPES.DELETED, data);
  } catch (error) {
    next(error);

  }
};

exports.deleteCompanyInterstatePrice = async (req, res, next) => {
  try {
    const interStateInstance = new interstatePriceService()
    let data = await interStateInstance.deleteCompanyInterstatePrice(req.query.id, req.body)
    return JsonResponse(res, 200, MSG_TYPES.DELETED, data);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateUpdateInterstatePrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    // const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    // if (!admin)
    //     return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const detail = await model.findById(req.params.id);
    if (!detail)
      return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);
    if (req.body.originCountry !== req.body.destinationCountry) {
      return JsonResponse(res, 400, "country origin and destination must be the same", null, null)
    }
    let data = { source: 'admin', currency: "NGN" }
    let savedData = Object.assign(req.body, data)
    await model.updateOne(savedData);

    return JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    next(error);
  }
};

exports.updateCompanyInterstatePrice = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateUpdateCompanyInterstatePrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);
    // create new account record
    const detail = await model.findOne({ $and: [{ company: req.params.id }, { _id: req.body.id }] });
    if (!detail)
      return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);
    if (detail.originCountry !== req.body.destinationCountry) {
      return JsonResponse(res, 400, "country origin and destination must be the same", null, null)
    }
    let data = { source: 'admin', currency: "NGN" }
    let savedData = Object.assign(req.body, data)
    await model.updateOne(savedData);

    return JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    next(error);
  }
};