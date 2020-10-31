const config = require("config");
const axios = require("axios");


exports.get = async (token) => {
  try {
    const response = await axios.get(
      `${config.get("application.baseUrl")}/user`,
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    throw error.response.data;
  }
};
