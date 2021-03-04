const Country = require("../models/countries");
const { AsyncForEach } = require("../utils");


class CountryService {
  getCountryAndState(country, state) {
    return new Promise(async (resolve, reject) => {
      // validate country
      const countryCheck = await Country.findOne({ name: country });
      if (!countryCheck) {
        reject({ code: 404, msg: "Country Not Found" });
        return;
      }

      // validate state
      const stateCheck = countryCheck.states.filter((v, i) => v.name === state);
      if (typeof stateCheck[0] === "undefined") {
        reject({ code: 404, msg: "State Not Found" });
        return;
      }

      resolve(countryCheck);
    });
  }

  getCountry(country) {
    return new Promise(async (resolve, reject) => {
      // validate country
      const countryCheck = await Country.findOne({ name: country });
      if (!countryCheck) {
        reject({ code: 404, msg: "Country Not Found" });
        return;
      }

      resolve(countryCheck);
    });
  }

  validateState(state, delivery) {
    return new Promise(async (resolve, reject) => {
     
      console.log("delivery", delivery);
      AsyncForEach(delivery, (data, index) => {
        if (state !== data.state) {
          return reject({
            code: 404,
            msg: "We handle only local delivery within the same state",
          });
        }
      })

      resolve();
    });
  }
}

module.exports = CountryService;