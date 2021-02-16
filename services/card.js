const config = require("config");
const axios = require("axios");
const { CARD_SERVICE } = require("../constant/api");

class CardService {

  /**
   * Get card details from card service
   * @param {*} filter 
   * @param {*} option 
   */
  get(filter, option = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(
          `${CARD_SERVICE.CARD_FINDONE}`,
          {
            filter,
            option,
          },
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );
        resolve(response.data.data);
      } catch (error) {
        if (error.response) {
          return reject(error.response.data);
        }
        reject(error);
      }
    });
  }
}

module.exports = CardService;