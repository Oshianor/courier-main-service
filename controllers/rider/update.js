const Joi = require("joi");
const { Company } = require("../../models/company");
const {
  Rider,
  validateUpdateRider,
  validateRiderStatus,
  validateRiderLocation,
} = require("../../models/rider");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { UploadFileFromBinary } = require("../../utils");
const {
  RiderCompanyRequest,
  validateStatusUpdate,
} = require("../../models/riderCompanyRequest");
const {
  OnlineHistory
} = require("../../models/onlineHistory");
const { Entry } = require("../../models/entry");

/**
 * Go online/offline
 * @param {*} req
 * @param {*} res
 */
exports.updateSingle = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.user.companyId,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, null, null);

    const rider = await Rider.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    });
    if (!rider) return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, null, null);

    JsonResponse(res, 200, MSG_TYPES.UPDATED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Respond to Riders Request
 * @param {*} req
 * @param {*} res
 */
exports.respond = async (req, res) => {
  try {
    const { error } = validateStatusUpdate(req.body);
    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }
    const request = await RiderCompanyRequest.findOne({
      _id: req.params.requestId,
    });
    if (!request)
      return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, null, null);

    const rider = await Rider.findOne({ _id: request.rider });

    if (req.body.status === "approved") {
      rider.company = request.company;
      await rider.save();
    }

    request.status = req.body.status;

    await request.save();

    JsonResponse(res, 200, MSG_TYPES.UPDATED, request, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Suspend rider account by Admin
 * @param {*} req
 * @param {*} res
 */
exports.status = async (req, res) => {
  try {
    const { error } = validateRiderStatus(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // // to disable a rider account we need to know if they
    // const entry = await Entry.findOne({
    //   $or: [
    //     { status: "ongoing", rider: req.params.rider },
    //     { status: "driverAccepted", rider: req.params.rider },
    //   ],
    // });

    // if (entry) return JsonResponse(res, 200, "This rider is currently on a trip", null, null);

    const rider = await Rider.findOne({ _id: req.params.rider });
    if (!rider) return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, rider, null);

    await rider.updateOne({ status: req.body.status });

    JsonResponse(res, 200, `Rider account ${req.body.status}`, null, null);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};



/**
 * SRider goline and offline
 * @param {*} req
 * @param {*} res
 */
exports.online = async (req, res) => {
  try {
    const rider = await Rider.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
    });
    if (!rider) return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, rider, null);

    let msg;
    if (rider.onlineStatus) {
      // to disable a rider account we need to know if they
      const entry = await Entry.findOne({
        $or: [
          { status: "ongoing", rider: req.user.id },
          { status: "driverAccepted", rider: req.user.id },
        ],
      });

      if (entry) return JsonResponse(res, 200, "You can't go offline while on a trip.", null, null);

      msg = "Offline Successfully ";
      await rider.updateOne({ onlineStatus: false });
      const newOnelineHistory = new OnlineHistory({
        rider: req.user.id,
        status: "offline",
      });
      await newOnelineHistory.save()
    } else {
      msg = "Online Successfully ";
      await rider.updateOne({ onlineStatus: true });
      const newOnelineHistory = new OnlineHistory({
        rider: req.user.id,
        status: "online",
      });
      await newOnelineHistory.save();
    }

    JsonResponse(res, 200, msg, null, null);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};



/**
 * Update rider location
 * @param {*} req
 * @param {*} res
 */
exports.location = async (req, res) => {
  try {
    const { error } = validateRiderLocation(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message, null, null);
      
    await Rider.updateOne({ _id: req.user.id }, req.body)

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
