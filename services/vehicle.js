const Vehicle = require("../models/vehicle");


class VehicleService {
  /**
   * Validate vehicles from list with database
   * @param {Array} vehicles
   */
  validateAllVehiclesFromList(vehicles) {
    return new Promise(async (resolve, reject) => {
      const vehicle = await Vehicle.find({
        _id: { $in: vehicles },
      }).countDocuments();

      if (vehicle !== vehicles.length) {
        reject({ code: 404, msg: "Please provide a valid vehicle" });
        return;
      }
      resolve(vehicle);
    });
  }
}

module.exports = VehicleService;