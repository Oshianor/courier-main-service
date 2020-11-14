const { Entry } = require("../models/entry");
const { Company } = require("../models/company");


exports.entry = (filter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const entry = await Entry.find(filter);
      resolve(entry);
    } catch (error) {
      reject("Something went wrong")
    }
  })
}

exports.company = (filter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const company = await Company.findOne({ $or: [{ status: "active" }, { status: "inactive" }], verified: true, ...filter});
      
      if (!company) {
        reject("Something went wrong");
      }
      
      resolve(company);
    } catch (error) {
      reject("Something went wrong");
    }
  });
};