const Pricing = require("../models/pricing")
const { MSG_TYPES } = require("../constant/types");

class PricingService {

  /**
 * Get pricing
 * @param {Object} filter
 */
  getPricing(filter = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const pricing = await Pricing.find(filter);
        if (pricing.length < 1) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        resolve(pricing);
      } catch (error) {
        eject({ statusCode: error.code, msg: error.msg });
        return
      }
    });
  }


}

module.exports = PricingService;