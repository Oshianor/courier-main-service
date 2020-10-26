const config = require("config");
const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { Vehicle, validateVehicle } = require("../../models/vehicle");
const { MSG_TYPES } = require("../../constant/msg");


exports.vehicle = async (req, res) => {
  try {
    // validate request
    const { error } = validateVehicle(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin) return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);

    // create new account record
    req.body.ref = req.body.type.toLowerCase().replace(/\s+/g, "_");
    const newVehicle = new Vehicle(req.body);
    await newVehicle.save();

    JsonResponse(res, 200, MSG_TYPES.CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};

