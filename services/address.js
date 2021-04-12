const { ADDRESS_SERVICE } = require("../constant/api");
const axios = require("axios");

class AddressService {
   /**
   * Get a user by it's token
   * @param {String} token
   */
   getEntryAddresses(token, addressIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(`${ADDRESS_SERVICE.GET_ENTRY_ADDRESSES}`,{
          addressIds
        },{
          headers: {
            "x-auth-token": token
          }
        });
        // console.log("response", response);
        resolve(response.data.data);

      } catch (error) {
        console.log('ERROR => ', error);
        if (error.response) {
          reject(error.response.data);
        }
        reject(error);
      }
    });
  }
}

module.exports = AddressService;