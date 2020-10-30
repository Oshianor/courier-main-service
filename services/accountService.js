const config = require("config");
const axios = require("axios");

exports.create = async (data) => {
  try {
    const postData = {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      service: "Logistics",
      type: data.type,
      country: data.country,
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
      `${config.get("application.baseUrl")}/country/name/${name}`
    );
    return true;
  } catch (error) {
    console.log(error.response.data);
    return false;
  }
};

exports.verify = async (body) => {
  try {
    const postData = {
      email: body.email,
      token: body.token,
      password: body.password,
    };
    const response = await axios.post(
      `${config.get("application.baseUrl")}/auth/verify`,
      postData
    );
    return response.data.data;
  } catch (error) {
    throw error.response.data;
  }
};

exports.login = async (body) => {
  try {
    const postData = {
      email: body.email,
      password: body.password,
    };
    const response = await axios.post(
      `${config.get("application.baseUrl")}/auth/login`,
      postData
    );
    return {
      account: response.data.data,
      token: response.headers["x-auth-token"],
    };
  } catch (error) {
    console.log(error.response.data);
    return { account: null, token: null };
  }
};
