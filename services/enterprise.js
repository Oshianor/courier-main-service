const config = require("config");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const axios = require("axios");
const Enterprise = require("../models/enterprise");
const { MSG_TYPES } = require("../constant/types");
const { UploadFileFromBinary, UploadFileFromBase64 ,convertToMonthlyDataArray } = require("../utils");
const User = require("../models/users");
const WalletService = require("./wallet");
const CreditService = require("./credit");
const UserService = require("./user");
const Entry = require("../models/entry");
const Transaction = require("../models/transaction");
const Order = require("../models/order");

class EnterpriseService {
  /**
   * Create organization HQ by Exalt admin
   * @param {Object} body
   */
  createOrganization(body, files, authUser) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();

      if (typeof files.logo === "undefined") {
        reject({ code: 404, msg: MSG_TYPES.ENTERPRISE_LOGO });
        return;
      }

      // create enterprise account
      if (files.logo.data != null) {
        const logo = await UploadFileFromBinary(
          files.logo.data,
          files.logo.name
        );
        body.logo = logo.Key;
      }

      // check if enterprise exists
      const existingEnterprise = await Enterprise.findOne({
        name: body.name,
        type: body.type,
        email: body.email,
        phoneNumber: body.phoneNumber,
      });

      if (existingEnterprise) {
        reject({
          code: 400,
          msg: "An Enterprise exists with same name email or phone number",
        });
        return;
      }

      // Create user account in account service (wrap account service)
      this.createExaltUser({
        name: body.name,
        email: body.email,
        countryCode: body.countryCode,
        phoneNumber: body.phoneNumber,
        img: body.logo,
      })
        .then(async (user) => {
          try {
            // start our transaction
            session.startTransaction();

            body.status = "inactive";
            body.type = "owner";
            body.verified = true;
            body.user = user._id;
            body.users = [user._id];
            body.usersAll = [user._id];
            body.createdBy = authUser.id;

            // create enterprise document
            const newEnterprise = new Enterprise(body);
            newEnterprise.HQ = newEnterprise._id;

            // create user in logistics service
            const courierUser = new User({
              ...user,
              role: "owner",
              group: "enterprise",
              enterprise: newEnterprise._id,
              img: body.logo,
            });
            await courierUser.save({ session });

            const walletInstance = new WalletService();
            const wallet = await walletInstance.createWallet(newEnterprise._id, session);

            const creditInstance = new CreditService();
            const credit = await creditInstance.createCredit(
              newEnterprise._id,
              session
            );

            newEnterprise.credit = credit;
            newEnterprise.wallet = wallet;
            await newEnterprise.save({ session });

            await session.commitTransaction();
            session.endSession();

            resolve({newEnterprise});
          } catch (error) {
            await session.abortTransaction();
            const userInstance = new UserService();
            await userInstance.deleteUser(user._id);
            if (error.response) {
              return reject({
                code: error.response.status,
                msg: error.response.data.msg,
              });
            }
            return reject({ code: error.code, msg: error.msg });
          }
        })
        .catch((error) => {
          return reject(error);
        });
    });
  }

  /**
   * Create organization branch by organization HQ
   * @param {Object} body
   * @param {Object} files
   * @param {Object} enterprise
   */
  createBranch(body, files, enterprise) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();

      if (typeof files.logo === "undefined") {
        reject({ code: 404, msg: MSG_TYPES.ENTERPRISE_LOGO });
        return;
      }

      // create enterprise account
      if (files && files.logo.data != null) {
        const logo = await UploadFileFromBinary(
          files.logo.data,
          files.logo.name
        );
        body.logo = logo.Key;
      }

      // check if enterprise exists
      const existingEnterprise = await Enterprise.findOne({
        name: body.name,
        type: body.type,
        email: body.email,
        phoneNumber: body.phoneNumber,
      });

      if (existingEnterprise) {
        reject({
          code: 400,
          msg: "An Enterprise exists with same name email or phone number",
        });
        return;
      }

      this.createExaltUser({
        name: body.name,
        email: body.email,
        countryCode: body.countryCode,
        phoneNumber: body.phoneNumber,
        img: body.logo,
      })
        .then(async (user) => {
          try {
            // start our transaction
            session.startTransaction();

            body.type = "branch";
            body.enterprise = enterprise._id;
            body.HQ = enterprise._id;
            body.user = user._id;
            body.users = [user._id];

            // create enterprise document
            const newEnterprise = new Enterprise(body);

            // create user in logistics service
            const courierUser = new User({
              ...user,
              role: "branch",
              group: "enterprise",
              enterprise: newEnterprise._id,
              img: body.logo,
            });
            await courierUser.save({ session });

            const walletInstance = new WalletService();
            const wallet = await walletInstance.createWallet(
              newEnterprise._id,
              session
            );

            const creditInstance = new CreditService();
            const credit = await creditInstance.createCredit(
              newEnterprise._id,
              session
            );

            newEnterprise.credit = credit;
            newEnterprise.wallet = wallet;

            await Enterprise.updateMany(
              { _id: enterprise._id },
              {
                $addToSet: {
                  branchIDS: newEnterprise._id,
                  branchIDSWithHQ: newEnterprise._id,
                  usersAll: user._id,
                  branchUserIDS: user._id,
                },
              },
              { session }
            );

            await newEnterprise.save({ session });

            await session.commitTransaction();
            session.endSession();

            resolve({ newEnterprise });
          } catch (error) {
            await session.abortTransaction();
            const userInstance = new UserService();
            await userInstance.deleteUser(user._id);
            return reject(error);
          }
        })
        .catch((error) => {
          return reject(error);
        });
    });
  }

  /**
   * Create maintainer  by organization HQ or branch
   * @param {Object} body
   */
  createMaintainer(body, enterprise) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();

      this.createExaltUser({
        name: body.name,
        email: body.email,
        countryCode: body.countryCode,
        phoneNumber: body.phoneNumber,
      })
        .then(async (user) => {
          try {
            // start our transaction
            session.startTransaction();

            // create user in logistics service
            const courierUser = new User({
              ...user,
              role: "maintainer",
              group: "enterprise",
              enterprise: enterprise._id,
            });
            await courierUser.save({ session });

            await Enterprise.updateMany(
              { _id: enterprise._id },
              {
                $addToSet: {
                  usersAll: user._id,
                  users: user._id,
                  maintainers: user._id,
                },
              },
              { session }
            );

            await session.commitTransaction();
            session.endSession();

            resolve({ user });
          } catch (error) {
            const userInstance = new UserService();
            await userInstance.deleteUser(user._id);
            return reject(error);
          }
        })
        .catch((error) => {
          return reject(error);
        });
    });
  }

  /**
   * Create user account - request to account service
   * @param {Object} body
   */
  createExaltUser(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(
          `${config.get("api.base")}/user/enterpise`,
          body,
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );

        resolve(response.data.data);
      } catch (error) {
        console.log("error", error);

        if (error.response) {
          return reject({
            code: error.response.status,
            msg: error.response.data.msg,
          });
        }
        return reject(error);
      }
    });
  }

  /**
   * Update user account - request to account service
   * @param {Object} body
   */
  updateExaltUser(userAuthToken, body) {
    return new Promise(async (resolve, reject) => {

      const accountUpdateData = {
        name: body.name,
        phoneNumber: body.phoneNumber
      };

      try {
        const response = await axios.patch(
          `${config.get("api.base")}/user/account`,
          accountUpdateData,
          {
            headers: {
              "x-auth-token": userAuthToken,
            },
          }
        );
        resolve(response.data.data);
      } catch (error) {
        if (error.response) {
          return reject({
            code: error.response.status,
            msg: error.response.data.msg,
          });
        }
        return reject(error);
      }
    });
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
          return;
        }
        resolve(user);
      } catch (error) {
        console.log("error", error);
        // error.service = 'Create logistics user service error'
        return reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get an enterprise details
   * @param {MongoDB ObjectId} userId
   */
  getEnterprise(userId) {
    return new Promise(async (resolve, reject) => {
      try {
        const organization = await User.findOne({_id: userId})
          .select("-createdBy -deleted -deletedBy -deletedAt")
          .populate("enterprise", "name type phoneNumber email address logo");

        if (!organization){
          return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
        }
        resolve(organization);
      } catch (error) {
        // error.service = 'Get enterprise service error'
        return reject(error);
      }
    });
  }

  /**
   * Get all Enterprise Branches
   * @param {Object} user
   * @param {Object} pagination
   */
  getAllBranches(user, pagination) {
    return new Promise(async (resolve, reject) => {
      try {
        const enterprise = await Enterprise.findOne({
          _id: user.enterprise,
        });

        if (!enterprise) {
          return reject({ code: 404, msg: "No enterprise account was found." });
        }

        const { skip, page, pageSize } = pagination;
        const enterpriseMaintainersToRetrieve = enterprise.branchUserIDS.slice(
          skip,
          page * pageSize
        );

        console.log(
          "enterpriseMaintainersToRetrieve",
          enterpriseMaintainersToRetrieve
        );
        const maintainers = await axios.post(
          `${config.get("api.base")}/user/maintainers`,
          {
            maintainers: enterpriseMaintainersToRetrieve,
          },
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );

        resolve({
          total: enterprise.branchUserIDS.length,
          branches: maintainers.data.data,
        });
      } catch (error) {
        if (error.response) {
          return reject({
            code: error.response.status,
            msg: error.response.data.msg,
          });
        }
        // error.service = "Get all maintainers service error";
        return reject(error);
      }
    });
  }

  /**
   * Get all Enterprise Maintainers
   * @param {Object} user
   * @param {Object} pagination
   */
  getAllMaintainers(user, pagination) {
    return new Promise(async (resolve, reject) => {
      try {
        const enterprise = await Enterprise.findOne({
          _id: user.enterprise,
        });

        if (!enterprise) {
          return reject({ code: 404, msg: "No enterprise account was found." });
        }

        const { skip, page, pageSize } = pagination;
        const enterpriseMaintainersToRetrieve = enterprise.maintainers.slice(
          skip,
          page * pageSize
        );

        const maintainers = await axios.post(
          `${config.get("api.base")}/user/maintainers`,
          {
            maintainers: enterpriseMaintainersToRetrieve,
          },
          {
            headers: {
              "api-key": config.get("api.key"),
            },
          }
        );

        resolve({
          total: enterprise.maintainers.length,
          maintainers: maintainers.data.data,
        });
      } catch (error) {
        if (error.response) {
          return reject({
            code: error.response.status,
            msg: error.response.data.msg,
          });
        }
        // error.service = "Get all maintainers service error";
        return reject(error);
      }
    });
  }

  /**
   * update enterprise
   * @param {Object} enterprise
   * @param {Object} updateObject
   * @param {string } userAuthToken Optional param, Should be provided for accounts service update
   */
  updateEnterprise(enterprise, updateObject, userAuthToken) {
    return new Promise(async (resolve, reject) => {
      try {
        const validEnterprise = await Enterprise.findOne(enterprise);
        if (!validEnterprise){
          return reject({ code: 400, msg: MSG_TYPES.NOT_FOUND });
        }

        if(userAuthToken){
          const updatedUserAccount = await this.updateExaltUser(userAuthToken, updateObject);
          if(!updatedUserAccount){
            return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
          }
        }

        // Upload image to s3 if any
        if (updateObject.logo) {
          const imageUpload = await UploadFileFromBase64(
            updateObject.logo,
            `${enterprise._id}_image`
          );

          if (imageUpload && imageUpload.key) {
            updateObject.logo = imageUpload.key;
          } else {
            return reject({ code: 500, msg: "Image upload failed" });
          }
        }

        const updatedEnterprise = await Enterprise.findOneAndUpdate(enterprise,
          { $set: updateObject },
          { new: true }
        );
        if (!updatedEnterprise){
          return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
        }

        resolve(updatedEnterprise);
      } catch (error) {
        console.log('Error => ', error);
        if (error.response) {
          return reject({
            code: error.response.status,
            msg: error.response.data.msg,
          });
        }

        error.service = "Update enterprise service error";
        return reject(error);
      }
    });
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

  /**
   * Get all Enterprise Entries
   * @param {MongoDB ObjectId} enterpriseId
   * @param {number} skip
   * @param {number} pageSize
   */
  getAllEntries(enterprise, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const queryFilter = {
          enterprise: enterprise._id,
          user: { $in: [ ...enterprise.users ]}
        }

        const entries = await Entry.find(queryFilter)
          .populate(
            "company",
            "name email phoneNumber countryCode img state address rating"
          )
          .populate("rider", "name email phoneNumber countryCode img rating")
          .populate("orders")
          .skip(skip)
          .limit(pageSize)
          .sort({createdAt: 'desc'});

        const total = await Entry.countDocuments(queryFilter);

        resolve({ entries, total });
      } catch (error) {
        return reject(error);
      }
    });
  }

  /**
   * Get all Enterprise Transactions
   * @param {MongoDB ObjectId} enterpriseId
   * @param {number} skip
   * @param {number} pageSize
   */
  getAllTransactions(enterprise, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const queryFilter = {
          enterprise: enterprise._id,
        }

        const transactions = await Transaction.find(queryFilter)
          .populate('user')
          .skip(skip)
          .limit(pageSize)
          .sort({createdAt: 'desc'});

        const total = await Transaction.countDocuments(queryFilter);

        resolve({ transactions, total });
      } catch (error) {
        return reject(error);
      }
    });
  }

  /**
   * @param {Object} enterprise object
   */
  getStatistics(enterprise){
    return new Promise(async(resolve, reject) => {
      try{
        const successfulDeliveryFilter = {
          enterprise: enterprise.id,
          status: "delivered"
        }
        const failedDeliveryFilter = {
          enterprise: enterprise.id,
          status: "canceled"
        }

        // Total deliveries by months
        let monthlySuccessfulDeliveries = await Order.aggregate(buildOrderAggregationPipeline(successfulDeliveryFilter));
        let monthlyFailedDeliveries = await Order.aggregate(buildOrderAggregationPipeline(failedDeliveryFilter));
        monthlySuccessfulDeliveries = convertToMonthlyDataArray(monthlySuccessfulDeliveries, 'numberOfDeliveries');
        monthlyFailedDeliveries = convertToMonthlyDataArray(monthlyFailedDeliveries, 'numberOfDeliveries');

        // Total deliveries
        const totalSuccessfulDeliveries = await Order.countDocuments(successfulDeliveryFilter);
        const totalFailedDeliveries = await Order.countDocuments(failedDeliveryFilter);

        // Total spent
        let totalSpent = await Transaction.aggregate([
          { $match: {enterprise: ObjectId(enterprise.id), status: "approved",approvedAt: {$ne:null}} },
          { $group: { _id: enterprise.id, "total": {$sum: "$amount"} }},
        ]);
        totalSpent = totalSpent[0] ? totalSpent[0].total : 0;

        const totalBranches = enterprise.branchUserIDS.length;
        const totalManagers = enterprise.maintainers.length;

        resolve({
          monthlySuccessfulDeliveries,
          monthlyFailedDeliveries,
          totalFailedDeliveries,
          totalSuccessfulDeliveries,
          totalBranches,
          totalManagers,
          totalSpent
        })

        function buildOrderAggregationPipeline(filter){
          return [
            { $match: { ...filter } },
            { $group:{ _id: {$month: "$createdAt"}, numberOfDeliveries: {$sum: 1}} },
            { $project: {_id:0, "month": "$_id", numberOfDeliveries: "$numberOfDeliveries"}}
          ]
        }
      } catch(error){
        return reject(error);
      }
    })
  }
}

module.exports = EnterpriseService;


  // /**
  //  * Get all Enterprise Branches
  //  * @param {MongoDB ObjectId} enterpriseId
  //  * @param {number} skip
  //  * @param {number} pageSize
  //  */
  // getAllBranches(enterpriseId, skip, pageSize) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const enterpriseBranches = await Enterprise.find({
  //         enterprise: enterpriseId,
  //         type: "branch",
  //       })
  //         .select("-createdBy -deleted -deletedBy -deletedAt")
  //         .skip(skip)
  //         .limit(pageSize);
  //       const totalBranches = await Enterprise.countDocuments({
  //         enterprise: enterpriseId,
  //         type: "branch",
  //       });
  //       resolve({ enterpriseBranches, totalBranches });
  //     } catch (error) {
  //       error.service = "Get all branches service error";
  //       return reject(error);
  //     }
  //   });
  // }