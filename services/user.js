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


exports.getCard = async (token, cardId) => {
  try {
    const response = await axios.get(
      `${config.get("application.baseUrl")}/card/${cardId}`,
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );

    console.log("response.data", response.data);
    return response.data.data;
  } catch (error) {
    console.log("error", error);
    console.log("error.data", error.data);
    throw error.response.data;
  }
};
