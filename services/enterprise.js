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
        body.user = user._id;

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
 * @param {Object} enterprise
 * @param {Object} files
*/
  createBranch(body, files, owner) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if enterprise exists
        const existingEnterprise = await Enterprise.findOne({ name: body.name, type: body.type, email: body.email, phoneNumber: body.phoneNumber })
        if (existingEnterprise) {
          reject({ code: 400, msg: "An Enterprise exists with same name email or phone number" })
          return
        }
        // Create user account in account service
        const userObject = {
          "name": body.name,
          "email": body.email,
          "type": "Logistics",
          "countryCode": body.countryCode,
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

        body.enterprise = owner._id;
        body.HQ = owner._id;
        body.user = user._id;

        const enterprise = await Enterprise.create(body);
        if (!enterprise) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }
        if (body.type === "owner") {
          await this.updateEnterprise({ _id: owner._id }, { branchIDSWithHQ: [...owner.branchIDSWithHQ, enterprise._id] })
        } else {
          await this.updateEnterprise({ _id: owner._id }, { branchIDS: [...owner.branchIDS, enterprise._id] })
        }
        // Create user account in logistics service 
        const logisticsUserObject = { ...user, role: "branch", group: "enterprise", enterprise: owner._id }
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
  createMaintainer(body, parentEnterprise) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if enterprise exists
        const existingEnterprise = await Enterprise.findOne({ name: body.name, type: body.type, email: body.email, phoneNumber: body.phoneNumber })
        if (existingEnterprise) {
          reject({ code: 400, msg: "An Enterprise exists with same name email or phone number" })
          return
        }
        // Create user account in account service
        const userObject = {
          "name": body.name,
          "email": body.email,
          "type": "Logistics",
          "group": "enterprise",
          "countryCode": body.countryCode,
          "phoneNumber": body.phoneNumber,
          "platform": "web"
        }
        const user = await this.createExaltUser(userObject)
        if (!user) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }

        body.enterprise = parentEnterprise._id;
        if (parentEnterprise.type === "owner") {
          body.HQ = parentEnterprise._id;
        }
        body.user = user._id;
        const enterprise = await Enterprise.create(body);
        if (!enterprise) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }
        await this.updateEnterprise({ _id: parentEnterprise._id }, { maintainers: [...parentEnterprise.maintainers, enterprise._id] })


        // Create user account in logistics service 
        const logisticsUserObject = { ...user, role: "maintainer", group: "enterprise", enterprise: parentEnterprise._id }
        const logisticsUser = await this.createLogisticsUser(logisticsUserObject);
        if (!logisticsUser) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
          return
        }

        resolve(enterprise);

      } catch (error) {
        console.log(error)
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
          .populate('enterprise', 'name type phoneNumber email address')
          .populate('branchIDS', 'name type phoneNumber email address')
          .populate('maintainer', 'name type phoneNumber email address');
        if (!organization) return reject({ code: 400, msg: MSG_TYPES.NOT_FOUND })
        resolve(organization)
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return
      }
    })
  }


  /**
   * Get all Enterprise Branches
   * @param {MongoDB ObjectId} enterpriseId
   * @param {number} skip
   * @param {number} pageSize
   */
  getAllBranches(enterpriseId, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const enterpriseBranches = await Enterprise.find({ enterprise: enterpriseId, type: 'branch' })
          .select('-createdBy -deleted -deletedBy -deletedAt')
          .skip(skip)
          .limit(pageSize);
        const totalBranches = await Enterprise.countDocuments({ enterprise: enterpriseId, type: 'branch' });
        resolve({ enterpriseBranches, totalBranches });
      } catch (error) {
        return reject({ code: error.code, msg: error.msg });
      }
    });
  }

  /**
 * Get all Enterprise Branches
 * @param {MongoDB ObjectId} enterpriseId
 * @param {number} skip
 * @param {number} pageSize
 */
  getAllMaintainers(enterpriseId, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const enterpriseMaintainers = await Enterprise.find({ enterprise: enterpriseId, type: 'maintainer' })
          .select('-createdBy -deleted -deletedBy -deletedAt')
          .skip(skip)
          .limit(pageSize);
        const totalMaintainers = await Enterprise.countDocuments({ enterprise: enterpriseId, type: 'maintainer' });
        resolve({ enterpriseMaintainers, totalMaintainers });
      } catch (error) {
        return reject({ code: error.code, msg: error.msg });
      }
    });
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
   * Add card by for enterprise with account service wrapper
   * @param {Object} body 
   */
  addCard(body, token) {
    return new Promise(async (resolve, reject) => {
      try {
        const card = await axios.post(
          `${config.get("api.base")}/card/enterprise`,
          body,
          {
            headers: {
              "x-auth-token": token,
              "api-key": config.get("api.key"),
            },
          }
        );

        console.log("card", card);

        resolve(card);
      } catch (error) {
        console.log("error", error);
        console.log("error", error.response);

        reject({ code: error.response.status, msg: error.response.data.msg });
        return;
      }
    });
  }

}


module.exports = EnterpriseService