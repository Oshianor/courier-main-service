const DistancePrice = require("../models/distancePrice");
const { MSG_TYPES } = require("../constant/types");


class DistancePriceService {
  /**
   * Get a single Distance Price
   * @param {Object} filter
   */
  get(filter = {}) {
    return new Promise(async (resolve, reject) => {
      // check if we have pricing for the location
      const distancePrice = await DistancePrice.findOne(filter);

      if (!distancePrice) {
        reject({ code: 404, msg: MSG_TYPES.FAILED_SUPPORT });
      }

      resolve(distancePrice);
    });
  }

  /**
   * Get multiple Distance Price based on the filer parameters
   * @param {Object} filter
   * @param {Object} option
   * @param {String} populate
   */
  getAll(filter = {}, option = null, populate = "") {
    return new Promise(async (resolve, reject) => {
      const select = option ? option : { password: 0, rememberToken: 0 };
      const distancePrice = await DistancePrice.find(filter)
        .select(select)
        .populate(populate);

      resolve(distancePrice);
    });
  }
}


module.exports = DistancePriceService;