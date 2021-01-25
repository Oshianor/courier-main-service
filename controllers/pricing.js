const config = require("config");
const Admin = require("../models/admin");
const Pricing = require("../models/pricing");
const { validatePricing } = require("../request/pricing");
const { MSG_TYPES } = require("../constant/types");
const { JsonResponse } = require("../lib/apiResponse");


exports.create = async (req, res, next) => {
  try {
    // validate request
    const { error } = validatePricing(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const newPricing = new Pricing(req.body);
    await newPricing.save();

    JsonResponse(res, 200, MSG_TYPES.CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    next(error);
  }
};


exports.all = async (req, res, next) => {
  try {
    // check if account exist
    // const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    // if (!admin)
    //   return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    const pricing = await Pricing.find();

    JsonResponse(res, 200, MSG_TYPES.FETCHED, pricing, null);
    return;
  } catch (error) {
    next(error);
  }
};


exports.update = async (req, res, next) => {
  try {
    // validate request
    const { error } = validateUpdatePricing(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    const pricing = await Pricing.findById(req.params.pricingId);
    if (!pricing)
      return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

    await pricing.updateOne(req.body);

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
    return;
  } catch (error) {
    next(error);
  }
};
