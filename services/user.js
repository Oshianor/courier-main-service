const config = require("config");
const axios = require("axios");

/**
 * User service class
 */
class UserService {
  /**
   * Get a user by it's token
   * @param {JWT token} token
   */
  get(token) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(`${config.get("api.base")}/user`, {
          headers: {
            "x-auth-token": token,
          },
        });
        resolve(response.data);
      } catch (error) {
        reject(error.response.data);
      }
    });
  }

  /**
   * Get all users by admin
   * @param {Object} filter
   */
  getAllUsers(filter) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(`${config.get("api.base")}/user/all`, {
          filter,
          headers: {
            "api-key": config.get("api.key"),
          },
        });
        resolve(response.data);
      } catch (error) {
        reject(error.response.data);
      }
    });
  }

  /**
   * Get a single user by it's ID
   * @param {ObjectId} filter
   */
  getByID(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(
          `${config.get("api.base")}/user/${id}`,
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );
        resolve(response.data);
      } catch (error) {
        reject(error.response.data);
      }
    });
  }

  /**
   * Get a single card for a user
   * @param {JWT token} token 
   * @param {ObjectId} card 
   */
  getCard(token, card) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(
          `${config.get("api.base")}/card/${card}`,
          {
            headers: {
              "x-auth-token": token,
            },
          }
        );
        resolve(response.data);
      } catch (error) {
        reject(error.response.data);
      }
    });
  }
}


module.exports = UserService;
