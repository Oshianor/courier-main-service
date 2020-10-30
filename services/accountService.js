const config = require("config");
const axios = require("axios");

exports.create = async (data) => {
  try {
    const postData = {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      type: "Logistics",
      // country: data.country,
      platform: data.platform,
      password: data.password,
    };
    const response = await axios.post(
      `${config.get("application.baseUrl")}/user`,
      postData
    );

    return response.data.data;
  } catch (error) {
    throw error.response.data;
  }
};

exports.getCountryByName = async (name) => {
  try {
    const { data } = await axios.get(
      `${config.get("application.baseUrl")}/country/${name}`
    );
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
