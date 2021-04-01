const { validateInterstatePrice, validateUpdateInterstatePrice } = require("../request/interstatePrice");
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

        const iTSP = new interstatePriceService();
        await iTSP.create(req.body)
        JsonResponse(res, 200, MSG_TYPES.CREATED);
        return;
    } catch (error) {
        next(error);

    }
};


exports.getAll = async (req, res, next) => {
    try {
        const iTSP = await model.find({})

        JsonResponse(res, 200, MSG_TYPES.FETCHED, iTSP);
        return;
    } catch (error) {
        next(error);

    }
};


exports.getById = async (req, res, next) => {
    try {
        const iTSP = new interstatePriceService()
        let data = await iTSP.getById(req.query.id)
        JsonResponse(res, 200, MSG_TYPES.FETCHED, data);
        return;
    } catch (error) {
        next(error);

    }
};

exports.delete = async (req, res, next) => {
    try {
        const iTSP = new interstatePriceService()
        let data = await iTSP.delete(req.query.id)
        JsonResponse(res, 200, MSG_TYPES.DELETED, data);
        return;
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
        const detail = await model.findById(req.query.id);
        if (!detail)
            return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND, null, null);

        await model.updateOne(req.body);

        JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
        return;
    } catch (error) {
        next(error);
    }
};