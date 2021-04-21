const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { MSG_TYPES } = require("../constant/types");
const {
  UploadFileFromBinary,
  UploadFileFromBase64,
  convertToMonthlyDataArray,
  filterUnpaidCashOnPickUpEntries
} = require("../utils");
const { populateMultiple } = require("../services/aggregate");
const UserService = require("./user");
const Entry = require("../models/entry");
const Transaction = require("../models/transaction");
const Order = require("../models/order");
const axios = require("axios");
const config = require("config");
const { ACCOUNT_SERVICE } = require("../constant/api");


class EnterpriseService {
  // [moved to accounts service]
  /**
   * Get an enterprise details
   * @param {MongoDB ObjectId} userId
   */
  // getEnterprise(userId) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       // const organization = await User.findOne({ _id: userId })
  //       //   .select("-createdBy -deleted -deletedBy -deletedAt")
  //       //   .populate(
  //       //     "enterprise",
  //       //     "name type phoneNumber email address logo motto industry"
  //       //   );

  //       // if (!organization) {
  //       //   return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
  //       // }
  //       // resolve(organization);
  //     } catch (error) {
  //       // error.service = 'Get enterprise service error'
  //       return reject(error);
  //     }
  //   });
  // }

  /**
   * Get all Enterprise Branches
   * @param {Object} user
   * @param {Object} pagination
   */
  // getAllBranches(user, pagination) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
        // const userInstance = new UserService();

        // const enterprise = await Enterprise.findOne({
        //   _id: user.enterprise,
        // });

        // if (!enterprise) {
        //   return reject({ code: 404, msg: "No enterprise account was found." });
        // }

        // const { skip, page, pageSize } = pagination;
        // const enterpriseMaintainersToRetrieve = enterprise.branchUserIDS.slice(
        //   skip,
        //   page * pageSize
        // );

        // const maintainers = await userInstance.getAllMaintainers(
        //   enterpriseMaintainersToRetrieve
        // );

        // resolve({
        //   total: enterprise.branchUserIDS.length,
        //   branches: maintainers.data,
        // });
  //     } catch (error) {
  //       // error.service = "Get all maintainers service error";
  //       return reject(error);
  //     }
  //   });
  // }

  /**
   * Get all Enterprise Maintainers
   * @param {Object} user
   * @param {Object} pagination
   */
  // getAllMaintainers(user, pagination) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
        // const enterprise = await Enterprise.findOne({
        //   _id: user.enterprise,
        // });

        // if (!enterprise) {
        //   return reject({ code: 404, msg: "No enterprise account was found." });
        // }

        // const { skip, page, pageSize } = pagination;
        // const enterpriseMaintainersToRetrieve = enterprise.maintainers.slice(
        //   skip,
        //   page * pageSize
        // );

        // const maintainers = await userInstance.getAllMaintainers(
        //   enterpriseMaintainersToRetrieve
        // );

        // resolve({
        //   total: enterprise.maintainers.length,
        //   maintainers: maintainers.data,
        // });
  //     } catch (error) {
  //       return reject(error);
  //     }
  //   });
  // }

  // [moved to accounts-service]
  /**
   * update enterprise
   * @param {Object} enterprise
   * @param {Object} updateObject
   * @param {string } userAuthToken Optional param, Should be provided for accounts service update
   */
  // updateEnterprise(enterprise, updateObject, userAuthToken) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
        // const userInstance = new UserService();

        // const validEnterprise = await Enterprise.findOne(enterprise);
        // if (!validEnterprise) {
        //   return reject({ code: 400, msg: MSG_TYPES.NOT_FOUND });
        // }

        // if (userAuthToken) {
        //   const updatedUserAccount = await userInstance.updateExaltUser(
        //     userAuthToken,
        //     updateObject
        //   );
        //   if (!updatedUserAccount) {
        //     return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
        //   }
        // }

        // // Upload image to s3 if any
        // if (updateObject.logo) {
        //   const imageUpload = await UploadFileFromBase64(
        //     updateObject.logo,
        //     `${enterprise._id}_image`
        //   );

        //   if (imageUpload && imageUpload.key) {
        //     updateObject.logo = imageUpload.key;
        //   } else {
        //     return reject({ code: 500, msg: "Image upload failed" });
        //   }
        // }

        // const updatedEnterprise = await Enterprise.findOneAndUpdate(
        //   enterprise,
        //   { $set: updateObject },
        //   { new: true }
        // );
        // if (!updatedEnterprise) {
        //   return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
        // }

        // resolve(updatedEnterprise);
  //     } catch (error) {
  //       console.log("Error => ", error);
  //       if (error.response) {
  //         return reject({
  //           code: error.response.status,
  //           msg: error.response.data.msg,
  //         });
  //       }

  //       error.service = "Update enterprise service error";
  //       return reject(error);
  //     }
  //   });
  // }

  /**
   * Get all Enterprise Entries
   * @param {MongoDB ObjectId} enterpriseId
   * @param {number} skip
   * @param {number} pageSize
   */
  getAllEntries(filter, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        filter = {
          ...filter,
          shipment: null
        }
        let entries = await Entry.find(filter)
          .populate(
            "company",
            "name email phoneNumber countryCode img state address rating"
          )
          .populate("rider", "name email phoneNumber countryCode img rating")
          .populate("orders")
          .populate("transaction")
          .skip(skip)
          .limit(pageSize)
          .sort({ createdAt: "desc" });

        let total = await Entry.countDocuments(filter);

        // For enterprise pickup confirmation
        // Filter out Cash on Pickup entries that haven't been paid for.
        if(filter.status === "arrivedAtPickup"){
          const { filteredEntries, filteredTotal } = await filterUnpaidCashOnPickUpEntries(entries, total);
          entries = filteredEntries;
          total = filteredTotal;
        }

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
        };

        let transactions = await Transaction.find(queryFilter)
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: "desc" })
        .lean();

        transactions = await populateMultiple(transactions, "user");

        const total = await Transaction.countDocuments(queryFilter);

        resolve({ transactions, total });
      } catch (error) {
        return reject(error);
      }
    });
  }

  /** DEPRECATED
   * @param {Object} enterprise object
   */
  getStatistics(enterprise) {
    return new Promise(async (resolve, reject) => {
      try {
        const successfulDeliveryFilter = {
          enterprise: enterprise._id,
          status: "delivered",
        };

        const failedDeliveryFilter = {
          enterprise: enterprise._id,
          status: "canceled",
        };

        // Total deliveries by months
        let monthlySuccessfulDeliveries = await Order.aggregate(
          buildOrderAggregationPipeline(successfulDeliveryFilter)
        );
        let monthlyFailedDeliveries = await Order.aggregate(
          buildOrderAggregationPipeline(failedDeliveryFilter)
        );
        monthlySuccessfulDeliveries = convertToMonthlyDataArray(
          monthlySuccessfulDeliveries,
          "numberOfDeliveries"
        );
        monthlyFailedDeliveries = convertToMonthlyDataArray(
          monthlyFailedDeliveries,
          "numberOfDeliveries"
        );

        // Total deliveries
        const totalSuccessfulDeliveries = await Order.countDocuments(
          successfulDeliveryFilter
        );
        const totalFailedDeliveries = await Order.countDocuments(
          failedDeliveryFilter
        );

        // Total spent
        let totalSpent = await Transaction.aggregate([
          {
            $match: {
              enterprise: ObjectId(enterprise._id),
              status: "approved",
              approvedAt: { $ne: null },
            },
          },
          { $group: { _id: enterprise._id, total: { $sum: "$amount" } } },
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
          totalSpent,
        });

        function buildOrderAggregationPipeline(filter) {
          return [
            { $match: { ...filter } },
            {
              $group: {
                _id: { $month: "$createdAt" },
                numberOfDeliveries: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                month: "$_id",
                numberOfDeliveries: "$numberOfDeliveries",
              },
            },
          ];
        }
      } catch (error) {
        return reject(error);
      }
    });
  }

  // [moved > accounts-service]
  /**
   * Get all Enterprise Transactions
   * @param {string} type - owner, branch, manager
   * @param {number} skip
   * @param {number} pageSize
   */
  // getEnterpriseAccounts(role, page, pageSize) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const response = await axios.get(
  //         `${config.get("api.base")}${ACCOUNT_SERVICE.GET_ENTERPRISE_ACCOUNTS}`,
  //         {
  //           headers: {
  //             "api-key": config.get("api.key"),
  //           },
  //           params: {
  //             role, page, pageSize
  //           }
  //         }
  //       );
  //       resolve(response.data);
  //     } catch (e) {
  //       console.log(e);
  //       return reject(e);
  //     }
  //   });
  // }

  /**
   * Get an enterprise record
   * @param {ObjectId} enterprise
   * */
  get(enterprise){
    return new Promise(async(resolve, reject) => {
      try{
        const response = await axios.get(`
        ${ACCOUNT_SERVICE.ENTERPRISE_FINDONE}`,
        {
          headers: {
          "api-key": config.get("api.key")
        },
        params: { enterprise }
      });

      if(response && response.data){
        resolve(response.data.data);
      } else {
        reject({code: 404, msg: "Enterprise not found"});
      }
      } catch(error){
        reject(error);
      }
    });
  }

  getAll(enterprises){
    return new Promise(async(resolve, reject) => {
      try{
        const response = await axios.get(`
          ${ACCOUNT_SERVICE.ENTERPRISE_FIND}`,
          {
            headers: {
            "api-key": config.get("api.key")
          },
          params: { enterprises }
        });

        if(response && response.data){
          resolve(response.data.data);
        } else {
          reject({code: 404, msg: "Enterprise not found"});
        }
      } catch(error){
        reject(error);
      }
    });
  }

  getCount(filter){
    return new Promise(async(resolve, reject) => {
      try{
        const response = await axios.get(`
          ${ACCOUNT_SERVICE.ENTERPRISE_COUNT}`,
          {
            headers: {
            "api-key": config.get("api.key")
          },
          params: { filter }
        });

        if(response && response.data){
          resolve(response.data.data);
        } else {
          reject({code: 404, msg: "Enterprise not found"});
        }
      } catch(error){
        reject(error);
      }
    });
  }
}

module.exports = EnterpriseService;