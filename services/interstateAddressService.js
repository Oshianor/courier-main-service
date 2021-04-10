const InterstateAddress = require("../models/interstateAddress");

class interstateAddressService {

  /**
   * Get address location details
   * @param {ObjectID} id 
   * @returns Object
   */
  getById = (locationId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const findData = await InterstateAddress.findById(locationId).populate(
          "interState"
        );
        if (!findData) {
          return reject({ code: 404, msg: "No Location address was found" });
        }

        resolve(findData);
      } catch (error) {
        reject(error);
      }
    });
  };
}

module.exports = interstateAddressService;
