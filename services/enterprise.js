const config = require("config");
const axios = require("axios");
const Enterprise = require('../models/enterprise');
const { MSG_TYPES } = require('../constant/types');
const { UploadFileFromBinary } = require("../utils");
const User = require("../models/users");

class EnterpriseService {
  /**
   * Create organization HQ by Exalt admin
   * @param {Object} body
  */
  createOrganization(body, files) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if enterprise exists
        const existingEnterprise = await Enterprise.findOne({ name: body.name, type: body.type, email: body.email, phoneNumber: body.phoneNumber })
        if (existingEnterprise) {
          reject({ code: 400, msg: "An Enterprise exists with same name email or phone number" })
          return
        }
        // Create user account in account service (wrap account service)
        const userObject = {
          "name": body.name,
          "email": body.email,
          "type": "Logistics",
          "countryCode": body.countryCode,
          "password": "Opendoor12345",
          "phoneNumber": body.phoneNumber,
          "platform": "web",
          "group": "enterprise"
        }
        const user = await this.createExaltUser(userObject)
        if (!user) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }
        // create enterprise account
        if (files.logo.data != null) {
          const logo = await UploadFileFromBinary(files.logo.data, files.logo.name);
          body.logo = logo.Key;
        }
        body.status = "active";

        const enterprise = await Enterprise.create(body);
        if (!enterprise) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }
        // Create user account in logistics service 
        const logisticsUserObject = { ...user, role: "owner", group: "enterprise", enterprise: enterprise._id }

        const logisticsUser = await this.createLogisticsUser(logisticsUserObject);
        if (!logisticsUser) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }
        resolve(enterprise);
      } catch (error) {
        if (error.response) {
          return reject({ code: error.response.status, msg: error.response.data.msg });
        }
        return reject({ code: error.code, msg: error.msg });
      }
    })
  }

  /**
 * Create organization branch by organization HQ
 * @param {Object} body
*/
  createBranch(body, files) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if enterprise exists
        const existingEnterprise = await Enterprise.findOne({ name: body.name, type: body.type, email: body.email, phoneNumber: body.phoneNumber })
        if (existingEnterprise) {
          reject({ code: 400, msg: "An Enterprise exists with same name email or phone number" })
          return
        }
        const enterpriseHQ = await Enterprise.findById(body.createdBy)
        if (!enterpriseHQ) {
          reject({ code: 400, msg: "HQ not Found" })
          return
        }

        // Create user account in account service
        const userObject = {
          "name": body.name,
          "email": body.email,
          "type": "Logistics",
          "countryCode": body.countryCode,
          "password": "Opendoor12345",
          "phoneNumber": body.phoneNumber,
          "platform": "web",
          "group": "enterprise"
        }
        const user = await this.createExaltUser(userObject)
        if (!user) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }

        // create enterprise account
        if (files.logo.data != null) {
          const logo = await UploadFileFromBinary(files.logo.data, files.logo.name);
          body.logo = logo.Key;
        }
        body.enterprise = body.createdBy;
        body.HQ = body.createdBy;
        const enterprise = await Enterprise.create(body);
        if (!enterprise) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }
        if (body.type == "HQ") {
          await this.updateEnterprise({ _id: body.createdBy }, { branchIDSWithHQ: [...enterpriseHQ.branchIDSWithHQ, enterprise._id] })
        } else {
          await this.updateEnterprise({ _id: body.createdBy }, { branchIDS: [...enterpriseHQ.branchIDS, enterprise._id] })
        }
        // Create user account in logistics service 
        const logisticsUserObject = { ...user, role: "branch", group: "enterprise", enterprise: body.createdBy }
        const logisticsUser = await this.createLogisticsUser(logisticsUserObject);
        if (!logisticsUser) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }

        resolve(enterprise);

      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return
      }
    })
  }

  /**
 * Create maintainer  by organization HQ or branch
 * @param {Object} body
*/
  createMaintainer(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const parentEnterprise = await Enterprise.findById(body.createdBy)
        if (!parentEnterprise) {
          reject({ code: 400, msg: "Parent Enterprise not Found" })
          return
        }
        // Create user account in account service
        const userObject = {
          "name": body.name,
          "email": body.email,
          "type": "Logistics",
          "group": "enterprise",
          "countryCode": body.countryCode,
          "password": "Opendoor12345",
          "phoneNumber": body.phoneNumber,
          "platform": "web"
        }
        const user = await this.createExaltUser(userObject)
        if (!user) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }
        // Create user account in logistics service 
        const logisticsUserObject = { ...user, role: "maintainer", group: "enterprise", enterprise: body.createdBy }
        const logisticsUser = await this.createLogisticsUser(logisticsUserObject);
        if (!logisticsUser) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }
        await this.updateEnterprise({ _id: body.createdBy }, { maintainers: [...parentEnterprise.maintainers, logisticsUserObject._id] })

        resolve(logisticsUser);

      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return
      }
    })
  }

  /**
   * Create user account - request to account service
   * @param {Object} userObject
  */
  createExaltUser(userObject) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(`${config.get("api.base")}/user`, userObject);
        if (response.status == 200) {
          resolve(response.data.data);
        }
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
        return
      } catch (error) {
        if (error.response) {
          return reject({ code: error.response.status, msg: error.response.data.msg });
        }
        reject({ code: error.code, msg: error.msg });
        return
      }
    })
  }

  /**
   * Create user account on logistics service
   * @param {Object} logisticsUser
  */
  createLogisticsUser(logisticsUser) {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await User.create(logisticsUser);
        if (!user) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
          return
        }
        resolve(user)
      } catch (error) {
        if (error.response) {
          return reject({ code: error.response.status, msg: error.response.data.msg });
        }
        reject({ code: error.code, msg: error.msg });
        return
      }
    })
  }


  /**
   * Get an enterprise details
   * @param {MongoDB ObjectId} enterprise
  */
  getEnterprise(enterprise) {
    return new Promise(async (resolve, reject) => {
      try {
        const organization = await Enterprise.findOne(enterprise)
          .select('-_id -createdBy -deleted -deletedBy -deletedAt')
          .populate('enterprise', 'name type phoneNumber email address');
        if (!organization) return reject({ code: 400, msg: MSG_TYPES.NOT_FOUND })
        resolve(organization)
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return
      }
    })
  }


  /**
   * update enterprise 
   * @param {Object} enterprise
   * @param {ObjectI} updateObject
  */
  updateEnterprise(enterprise, updateObject) {
    return new Promise(async (resolve, reject) => {
      try {
        const validEnterprise = await Enterprise.findOne(enterprise)
        if (!validEnterprise) return reject({ code: 400, msg: MSG_TYPES.NOT_FOUND })

        const updatedEnterprise = await Enterprise.updateOne(
          enterprise,
          {
            $set: updateObject,
          }
        );
        if (!updatedEnterprise) return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
        resolve(updatedEnterprise)
      } catch (error) {
        reject({ code: error.code, msg: error.msg })
        return
      }
    })
  }

  /**
   * Disable branch 
   * @param {Object} body
  */
  disableBranch(body) {
    // return new Promise(async (resolve, reject) => {
    //   try {
    //     const validBranch = await Enterprise.findById(body.branch)
    //     if (!validBranch) return reject({ code: 400, msg: MSG_TYPES.NOT_FOUND })

    //     const updatedEnterprise = await Enterprise.updateOne(
    //       { _id: body.branch },
    //       {
    //         $set: { status: "suspended" },
    //       }
    //     );
    //     if (!updatedEnterprise) return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
    //     resolve(updatedEnterprise)
    //   } catch (error) {
    //     reject({ code: error.code, msg: error.msg })
    //     return
    //   }
    // })
  }

  /**
   * Disable maintainer 
   * @param {Object} body
  */
  disableMaintainer(body) {
    // return new Promise(async (resolve, reject) => {
    //   try {
    //     const validMaintainer = await User.findById(body.branch)
    //     if (!validMaintainer) return reject({ code: 400, msg: MSG_TYPES.NOT_FOUND })

    //     const updatedMaintainer = await User.updateOne(
    //       { _id: body.maintainer },
    //       {
    //         $set: { status: "suspended" },
    //       }
    //     );
    //     if (!updatedMaintainer) return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
    //     resolve(updatedMaintainer)
    //   } catch (error) {
    //     reject({ code: error.code, msg: error.msg })
    //     return
    //   }
    // })
  }

}


module.exports = EnterpriseService