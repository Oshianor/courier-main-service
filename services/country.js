const Country = require("../models/countries");


class CountryService {
  // constructor() {
  //   this.getCountryAndState = getCountryAndState;
  //   this.getCountry = getCountry;
  // }

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
}

module.exports = CountryService;