const InterstatePrice = require("../models/interstatePrice");

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
}

module.exports = interstatePriceService;
