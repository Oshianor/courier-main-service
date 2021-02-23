const Vehicle = require("../models/vehicle");


class VehicleService {
  /**
   * Get a single vehicle
   * @param {string} vehicleId // vehicle ID
   */
  get(vehicleId) {
    return new Promise(async (resolve, reject) => {
      const vehicle = await Vehicle.findById(vehicleId);

      if (!vehicle) {
        reject({ code: 404, msg: "No Vehicle was found." });
        return;
      }

      resolve(vehicle);
    });
  }

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