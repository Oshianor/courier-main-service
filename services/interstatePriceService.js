const interstateModel = require("../models/interstatePrice");

class interstatePriceService {
    create = (options) => {
        return new Promise(async (resolve, reject) => {
            const checkExist = await interstateModel.findOne({
                $and: [
                    { originCountry: options.originCountry },
                    { originState: options.originState },
                    { destinationState: options.destinationState },
                    { destinationCountry: options.destinationCountry },
                ],
            });
            if (!checkExist) {
                let createData = await interstateModel.create(options);
                resolve(createData);
            }
            reject({ code: 400, msg: "Inputs already exists" });
        });
    };

    getById = (id) => {
        return new Promise(async (resolve, reject) => {
            const findData = await interstateModel.findById({ _id: id });
            if (!findData) {
                reject({ code: 404, msg: "Data not found" });
            }
            resolve(findData);
        });
    };

    delete = (id) => {
        return new Promise(async (resolve, reject) => {
            const deleteData = await interstateModel.findByIdAndDelete({ _id: id });
            if (deleteData) {
                resolve(deleteData);
            }
            reject({ code: 404, msg: "Error deleting data" });


        });
    }
}

module.exports = interstatePriceService;
