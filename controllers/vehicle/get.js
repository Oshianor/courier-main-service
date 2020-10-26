const { JsonResponse } = require("../../lib/apiResponse");
const { Admin } = require("../../models/admin");
const { Vehicle} = require("../../models/vehicle");
const { MSG_TYPES } = require("../../constant/msg");


exports.all = async (req, res) => {
  try {
    // check if account exist
    const admin = await Admin.findOne({ _id: req.user.id, status: "active" });
    if (!admin) return JsonResponse(res, 400, MSG_TYPES.ACCESS_DENIED, null, null);


    const vehicle = await Vehicle.find();

    JsonResponse(res, 200, MSG_TYPES.FETCHED, vehicle, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
