const Admin = require("../models/admin");
const Vehicle = require("../models/vehicle");
const {
  validateVehicle,
  validateUpdateVehicle,
} = require("../request/vehicle");
const { MSG_TYPES } = require("../constant/types");
const { JsonResponse } = require("../lib/apiResponse");
const { UploadFileFromBinary } = require("../utils");


exports.vehicle = async (req, res) => {
  try {
    // validate request
    const { error } = validateVehicle(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);
    req.body.ref = req.body.type.toLowerCase().replace(/\s+/g, "_");


    const vehicle = await Vehicle.findOne({ ref: req.body.ref });
    if (vehicle) return JsonResponse(res, 400, "Vehicle already exist");

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED);

    // create new account record
    if (!req.files.img) return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED);

    const img = await UploadFileFromBinary(req.files.img.data, req.files.img.name);
    req.body.img = img.key;

    const newVehicle = new Vehicle(req.body);
    await newVehicle.save();

    JsonResponse(res, 200, MSG_TYPES.CREATED);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
    return;
  }
};

exports.all = async (req, res) => {
  try {
    const vehicle = await Vehicle.find();

    JsonResponse(res, 200, MSG_TYPES.FETCHED, vehicle);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
    return;
  }
};


exports.updateVehicle = async (req, res) => {
  try {
    // validate request
    const { error } = validateUpdateVehicle(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin)
      return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED);

    if (req.files && req.files.img) {
      const img = await UploadFileFromBinary(
        req.files.img.data,
        req.files.img.name
      );
      req.body.img = img.key;
    }
    // create new account record
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle)
      return JsonResponse(res, 400, MSG_TYPES.NOT_FOUND);

    if (req.body.type) {
      req.body.ref = req.body.type.toLowerCase().replace(/\s+/g, "_");
    }
    await vehicle.updateOne(req.body);

    JsonResponse(res, 200, MSG_TYPES.UPDATED);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
    return;
  }
};
