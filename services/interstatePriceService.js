const InterstatePrice = require("../models/interstatePrice");
const Company = require('../models/company');
class interstatePriceService {
  create = (options) => {
    return new Promise(async (resolve, reject) => {
      try {
        const checkExist = await InterstatePrice.findOne({
          $and: [
            { originCountry: options.originCountry },
            { originState: options.originState },
            { destinationState: options.destinationState },
            { destinationCountry: options.destinationCountry },
          ],
        });
        if (!checkExist) {
          let createData = await InterstatePrice.create(options);
          resolve(createData);
        }
        reject({ code: 400, msg: "Inputs already exists" });
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  createCompanyInterstatePrice = (id, options) => {
    return new Promise(async (resolve, reject) => {
      try {
        const getCompanyDetails = await Company.findById({ _id: id });
        const checkExist = await InterstatePrice.findOne({
          $and: [
            { originCountry: getCompanyDetails.country },
            { originState: getCompanyDetails.state },
            { destinationState: options.destinationState },
            { destinationCountry: options.destinationCountry },
            { company: getCompanyDetails._id },
            { organization: getCompanyDetails.organization }
          ],
        });
        if (!checkExist) {
          let data = {
            originCountry: getCompanyDetails.country,
            originState: getCompanyDetails.state,
            company: getCompanyDetails._id,
            organization: getCompanyDetails.organization
          }
          let savedData = Object.assign(options, data)
          let createData = await InterstatePrice.create(savedData);
          resolve(createData);
        }
        reject({ code: 400, msg: "Inputs already exists" });
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" })
      }
    })
  }

  getById = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const findData = await InterstatePrice.findById({ _id: id });
        if (!findData) {
          return reject({ code: 404, msg: "Data not found" });
        }
        resolve(findData);
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  getCompanyInterStatePriceById = (companyId, option) => {
    return new Promise(async (resolve, reject) => {
      try {
        const findData = await InterstatePrice.findOne({ $and: [{ company: companyId }, { _id: option.id }] });
        if (!findData) {
          return reject({ code: 404, msg: "Data not found" });
        }
        resolve(findData);
      } catch (error) {
        console.log(error)
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  delete = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deleteData = await InterstatePrice.findByIdAndDelete({ _id: id });
        if (deleteData) {
          resolve(deleteData);
        }
        reject({ code: 404, msg: "Error deleting data" });
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  deleteCompanyInterstatePrice = (companyId, option) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deleteData = await InterstatePrice.findOneAndDelete({ $and: [{ company: companyId }, { _id: option.id }] });
        if (deleteData) {
          resolve(deleteData);
        }
        reject({ code: 404, msg: "Error deleting data" });
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };


}

module.exports = interstatePriceService;
