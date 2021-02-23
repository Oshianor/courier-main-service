const IndustryCategory = require("../models/industryCategory");
const { MSG_TYPES } = require("../constant/types");
const Admin = require("../models/admin");


class IndustryCategoryService {
  /**
   * Create industry Category
   * @param {object} body body request
   * @param {object} user auth user body
   */
  CreateCategory(body, user) {
    return new Promise(async (resolve, reject) => {
      const IC = await IndustryCategory.findOne({ name: body.name });
      if (IC){
        return reject({ code: 400, msg: "Industry Category already exist" })
      }


      // check if account exist
      const admin = await Admin.findOne({ _id: user.id, status: "active" });
      if (!admin) {
        reject({ code: 400, msg: MSG_TYPES.ACCESS_DENIED });
        return;
      }

      const newIC = new IndustryCategory(body);
      await newIC.save();

      resolve(newIC);
    });
  }


  /**
   * Validate industry category name
   * @param {String} name 
   */
  validateIC(name) {
    return new Promise(async (resolve, reject) => {
      const IC = await IndustryCategory.findOne({ name: name });
      if (!IC) {
        return reject({ code: 400, msg: "Industry Category doesn't exist" });
      }

      resolve(IC);
    })
  }
}

module.exports = IndustryCategoryService;