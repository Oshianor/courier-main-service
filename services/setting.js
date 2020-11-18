const Setting = require("../models/settings");
const { MSG_TYPES } = require("../constant/types");


class SettingService {
  /**
   * Get a single Setting
   * @param {Object} filter 
   */
  get (filter={}) {
    return new Promise(async (resolve, reject) => {
      // check if we have pricing for the location
      const setting = await Setting.findOne(filter);

      if (!setting) {
        reject({ code: 404, msg: MSG_TYPES.FAILED_SUPPORT });
      }

      resolve(setting);
    })
  }

  /**
   * Get multiple admin based on the filer parameters
   * @param {Object} filter 
   * @param {Object} option 
   * @param {String} populate 
   */
  getAll (filter={}, option=null, populate="") {
    return new Promise(async (resolve, reject) => {
      const select = option ? option : { password: 0, rememberToken: 0 };
      const setting = await Setting.find(filter)
        .select(select)
        .populate(populate);

      resolve(setting);
    })
  }

}


module.exports = SettingService;