const mongoose = require("mongoose");
const { validateInterstatePrice, validateUpdateInterstatePrice, validateCompanyInterstatePrice, validateUpdateCompanyInterstatePrice, validateInterstateDropOffPrice } = require("../request/interstatePrice");
const { validateInterstateAddress } = require("../request/interStateAddress");
const { MSG_TYPES } = require("../constant/types");
const { JsonResponse } = require("../lib/apiResponse");
const model = require('../models/interstatePrice')
const interstatePriceService = require("../services/interstatePriceService")
const interStateInstance = new interstatePriceService();
const EntryService = require("../services/entry");
const { AsyncForEach } = require("../utils");
const entryInstance = new EntryService();
const InterstateAddress = require("../models/interstateAddress");

exports.create = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateInterstatePrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const address = await interStateInstance.create(req.body);

    return JsonResponse(res, 200, MSG_TYPES.CREATED, address);
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

    let data = await interStateInstance.getById(req.query.id)
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, data);
  } catch (error) {
    next(error);

  }
};

exports.getCompanyInterStatePriceById = async (req, res, next) => {
  try {
    let data = await interStateInstance.getCompanyInterStatePriceById(req.query.id, req.body)
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, data);
  } catch (error) {
    next(error);

  }
};

exports.delete = async (req, res, next) => {
  try {
    let data = await interStateInstance.delete(req.query.id)
    return JsonResponse(res, 200, MSG_TYPES.DELETED, data);
  } catch (error) {
    next(error);

  }
};

exports.deleteCompanyInterstatePrice = async (req, res, next) => {
  try {
    let data = await interStateInstance.deleteCompanyInterstatePrice(req.query.id, req.body)
    return JsonResponse(res, 200, MSG_TYPES.DELETED, data);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    // start our transaction
    session.startTransaction();
    const newISP = req.params.id
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
    const location = [];
    await AsyncForEach(req.body.location, async (arr) => {
      // console.log("arr", arr);
      const address = await entryInstance.getGooglePlace(arr.address);

      location.push({
        ...arr,
        address: address[0].formatted_address,
        ...address[0].geometry.location,
        interState: newISP,
        state: req.body.destinationState,
        country: req.body.destinationCountry,
      });
    });
    await InterstateAddress.deleteMany({ interState: newISP })
    await InterstateAddress.create(location, { ...session });
    await session.commitTransaction();
    session.endSession();
    return JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  }
};

exports.updateCompanyInterstatePrice = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    // validate request
    session.startTransaction();
    const newISP = req.body.id

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
    let data = { source: 'company', currency: "NGN" }
    let savedData = Object.assign(req.body, data)
    await model.update({ company: newISP }, savedData);
    const location = [];
    await AsyncForEach(req.body.location, async (arr) => {
      // console.log("arr", arr);
      const address = await entryInstance.getGooglePlace(arr.address);

      location.push({
        ...arr,
        address: address[0].formatted_address,
        ...address[0].geometry.location,
        interState: newISP,
        state: req.body.destinationState,
        country: req.body.destinationCountry,
      });
    });
    await InterstateAddress.deleteMany({ interState: newISP })
    await InterstateAddress.create(location, { ...session });
    await session.commitTransaction();
    session.endSession();
    return JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    next(error);
  }
};

exports.createInterstateAddress = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateInterstateAddress(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const data = await interStateInstance.createInterstateAddress(req.body)
    return JsonResponse(res, 200, MSG_TYPES.CREATED, data);
  } catch (error) {
    next(error)
  }
}

exports.createDropoffPrice = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateInterstateDropOffPrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const data = await interStateInstance.createDropoffPrice(req.body)
    return JsonResponse(res, 200, MSG_TYPES.CREATED, data);
  } catch (error) {
    next(error)
  }
}

exports.getInterstateAddress = async (req, res, next) => {
  try {
    const data = await interStateInstance.getInterstateAddress(req.query.state)
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, data);
  } catch (error) {
    next(error)
  }
}