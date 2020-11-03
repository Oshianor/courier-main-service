const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { Vehicle } = require("../../models/vehicle");
const { MSG_TYPES } = require("../../constant/types");

exports.all = async (req, res) => {
  try {
    const vehicle = await Vehicle.find();

    JsonResponse(res, 200, MSG_TYPES.FETCHED, vehicle, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
