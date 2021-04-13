const mongoose = require("mongoose");
const {
  validateInterstatePrice,
  validateUpdateInterstatePrice,
  validateCompanyInterstatePrice,
  validateUpdateCompanyInterstatePrice,
  validateInterstateDropOffPrice,
  validateGetDropLocationPrices,
  updateInterstateDropOffPrice
} = require("../request/interstatePrice");
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
const { paginate } = require("../utils");

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

exports.changeInterstateAddressStatus = async (req, res, next) => {
  try {
    const data = await interStateInstance.changeInterstateAddressStatus(req.params.id)
    return JsonResponse(res, 200, MSG_TYPES.UPDATED, data);
  } catch (error) {
    next(error)
  }
}

exports.getAllInterstateAddress = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const { data, total } = await interStateInstance.getAllInterstateAddress(pageSize, page, skip)

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, data, meta);
  } catch (error) {
    next(error)
  }
}

exports.getAllInterstateDropOff = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const { data, total } = await interStateInstance.getAllInterstateDropOff(pageSize, page, skip)

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, data, meta);
  } catch (error) {
    next(error)
  }
}


exports.deleteInterstateAddress = async (req, res, next) => {
  try {
    const data = await interStateInstance.deleteInterstateAddress(req.params.id)
    return JsonResponse(res, 200, MSG_TYPES.DELETED, data);
  } catch (error) {
    next(error)
  }
}


exports.deleteInterstateDropOffPrice = async (req, res, next) => {
  try {
    const data = await interStateInstance.deleteInterstateDropOffPrice(req.params.id)
    return JsonResponse(res, 200, MSG_TYPES.DELETED, data);
  } catch (error) {
    next(error)
  }
}

exports.updateInterstateAddress = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateInterstateAddress(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const data = await interStateInstance.updateInterstateAddress(req.params.id, req.body)
    return JsonResponse(res, 200, MSG_TYPES.UPDATED, data);
  } catch (error) {
    next(error)
  }
}


exports.updateDropOffPrice = async (req, res, next) => {
  try {
    // validate request
    const { error } = updateInterstateDropOffPrice(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const data = await interStateInstance.updateDropOffPrice(req.params.id, req.body)
    return JsonResponse(res, 200, MSG_TYPES.CREATED, data);
  } catch (error) {
    next(error)
  }
}

exports.getDropOffLocationPrices = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateGetDropLocationPrices(req.query);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const data = await interStateInstance.getDropOffLocationPrices(req.query);
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, data);
  } catch (error) {
    next(error)
  }
}