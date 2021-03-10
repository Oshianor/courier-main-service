
const mongoose = require("mongoose");
const Transaction = require("../models/transaction");
const { convertToMonthlyDataArray, isObject } = require("../utils");
const { MSG_TYPES } = require("../constant/types");
const Order = require("../models/order");
const Rider = require("../models/rider");
const CreditHistory = require("../models/creditHistory");
const Company = require("../models/company");
const Vehicle = require("../models/vehicle");
const EnterpriseService = require("./enterprise");
const UserService = require("./user");
const { ObjectId } = mongoose.Types;

const enterpriseInstance = new EnterpriseService();

class StatisticsService {
  constructor(){
    this.successfulDeliveryFilter = { status: "delivered" };
    this.failedDeliveryFilter = { status: "canceled" };
    this.pendingDeliveryFilter = { status: "pending" };
    this.activeDeliveryFilter = { status: {$nin: ["delivered","cancelled","pending"]}};
    this.approvedCreditFilter = { type: "loan", status: "approved"};
    this.declinedCreditFilter = { type: "loan", status: "declined"};
  }

  /**
  * GET platform statistics - revenue, orders, riders summary
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
  getGeneralStatistics(filter = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // Coercing to ObjectIds because the $match stage of the aggregation needs it that way
        if(filter.enterprise && typeof(filter.enterprise) === 'string'){
          filter.enterprise = ObjectId(filter.enterprise);
        }
        if(filter.company && typeof(filter.company) === 'string'){
          filter.company = ObjectId(filter.company);
        }

        const deliveryStatistics = await this.getDeliveryStatistics(filter);
        const totalRevenue = await this.getTotalRevenue(filter);
        const totalRiders = await this.getRiderCount(filter);

        // Total deliveries by months
        let monthlySuccessfulDeliveries = await Order.aggregate(
          buildOrderAggregationPipeline({...filter, ...this.successfulDeliveryFilter})
        );
        let monthlyFailedDeliveries = await Order.aggregate(
          buildOrderAggregationPipeline({...filter, ...this.failedDeliveryFilter})
        );
        monthlySuccessfulDeliveries = convertToMonthlyDataArray(monthlySuccessfulDeliveries, 'numberOfDeliveries');
        monthlyFailedDeliveries = convertToMonthlyDataArray(monthlyFailedDeliveries, 'numberOfDeliveries');


        console.log(filter);
        let monthlyRevenues = await Transaction.aggregate([
          { $match: {...filter, status: "approved"} },
          { $group:{ _id: {$month: "$approvedAt"}, revenue: {$sum: "$amount"}} },
          { $project: {_id:0, "month": "$_id", revenue: "$revenue"}}
        ]);
        monthlyRevenues = convertToMonthlyDataArray(monthlyRevenues, "revenue");


        const statisticsData = {
          ...deliveryStatistics,
          totalRiders,
          totalRevenue,
          monthlyFailedDeliveries,
          monthlySuccessfulDeliveries,
          monthlyRevenues,
        }

        if(filter.enterprise && ObjectId.isValid(filter.enterprise)){

          const enterpriseRecord = await enterpriseInstance.get(filter.enterprise.toString());

          if(enterpriseRecord){
            statisticsData.totalBranches = await enterpriseInstance.getCount({
              role: "branch",
              parentEnterprise: filter.enterprise.toString()
            })
            statisticsData.totalManagers = await enterpriseInstance.getCount({
              role: "maintainer",
              parentEnterprise: filter.enterprise.toString()
            })
          }
        }

        resolve(statisticsData);

        function buildOrderAggregationPipeline(filter){
          return [
            { $match: { ...filter } },
            { $group:{ _id: {$month: "$createdAt"}, numberOfDeliveries: {$sum: 1}} },
            { $project: {_id:0, "month": "$_id", numberOfDeliveries: "$numberOfDeliveries"}}
          ]
        }
      } catch (error) {
        console.log('Statistics service Error => ', error);
        return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
      }
    })
  }

  /**
  * GET statistics - revenue, orders, riders summary
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
 getEnterpriseStatistics(){
   return new Promise(async(resolve, reject) => {
     try{
      const generalStatistics = await this.getGeneralStatistics();

      const totalAdmins = await enterpriseInstance.getCount({role: "owner"});
      const totalMaintainers = await enterpriseInstance.getCount({role: "maintainer"});
      const totalBranches = await enterpriseInstance.getCount({role: "branch"});

      let totalCreditsDisbursed = await CreditHistory.aggregate([
        { $match: {type: "loan", status: "approved"} },
        { $group: { _id: 1, "total": {$sum: "$amount"} }},
      ]);

      let totalCreditsUsed = await CreditHistory.aggregate([
        { $match: {type: "debit"}},
        { $group: { _id: 1, "total": {$sum: "$amount"} }},
      ]);

      totalCreditsDisbursed = totalCreditsDisbursed[0] ? totalCreditsDisbursed[0].total : 0;
      totalCreditsUsed = totalCreditsUsed[0] ? totalCreditsUsed[0].total : 0;

      const totalCreditsRemaining = totalCreditsDisbursed - totalCreditsUsed;

      // Total deliveries by months
      let monthlyApprovedCredits = await CreditHistory.aggregate(
        buildCreditAggregationPipeline(this.approvedCreditFilter)
      );
      let monthlyDeclinedCredits = await CreditHistory.aggregate(
        buildCreditAggregationPipeline(this.declinedCreditFilter)
      );

      monthlyApprovedCredits = convertToMonthlyDataArray(monthlyApprovedCredits, 'totalAmount');
      monthlyDeclinedCredits = convertToMonthlyDataArray(monthlyDeclinedCredits, 'totalAmount');

       resolve({
         ...generalStatistics,
         totalAdmins,
         totalBranches,
         totalMaintainers,
         totalCreditsDisbursed,
         totalCreditsUsed,
         totalCreditsRemaining,
         monthlyApprovedCredits,
         monthlyDeclinedCredits
       });

       function buildCreditAggregationPipeline(filter){
        return [
          { $match: { ...filter } },
          { $group:{ _id: {$month: "$createdAt"}, totalAmount: {$sum: "$amount"}} },
          { $project: {_id:0, "month": "$_id", totalAmount: "$totalAmount"}}
        ]
      }

      } catch(error){
        console.log('Statistics service Error => ', error);
        return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
      }
    })
  }

  /**
  * GET delivery statistics - total,pending,successful, failed deliveries
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
  getDeliveryStatistics(filter = {}){
    return new Promise(async(resolve, reject) => {
      try{

        const totalDeliveries = await Order.countDocuments({...filter});
        const totalPendingDeliveries = await Order.countDocuments({...filter, ...this.pendingDeliveryFilter});
        const totalFailedDeliveries = await Order.countDocuments({...filter, ...this.failedDeliveryFilter});
        const totalSuccessfulDeliveries = await Order.countDocuments({...filter, ...this.successfulDeliveryFilter});
        const totalActiveDeliveries = await Order.countDocuments({...filter, ...this.activeDeliveryFilter});

        resolve({
          totalDeliveries,
          totalFailedDeliveries,
          totalSuccessfulDeliveries,
          totalPendingDeliveries,
          totalActiveDeliveries
        });
      } catch(error){
        console.log('Delivery Statistics service Error => ', error);
        reject({code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    })
  }

  /**
  * GET total revenue
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
  getTotalRevenue(filter = {}){
    return new Promise(async(resolve, reject) => {
      try{
        let totalRevenue = await Transaction.aggregate([
          { $match: {...filter, status: "approved", approvedAt: {$ne:null}} },
          { $group: { _id: 1, "total": {$sum: "$amount"} }},
        ]);
        totalRevenue = totalRevenue[0] ? totalRevenue[0].total : 0;

        resolve(totalRevenue);
      } catch(error){
        console.log('Total revenue Statistics service Error => ', error);
        reject({code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    })
  }

  /**
  * GET total commission
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
  getTotalCommission(filter = {}){
    return new Promise(async(resolve, reject) => {
      try{
        let totalComission = await Transaction.aggregate([
          { $match: {...filter, status: "approved", approvedAt: {$ne:null}} },
          { $group: { _id: 1, "total": {$sum: "$commissionAmount"} }},
        ]);
        totalComission = totalComission[0] ? totalComission[0].total : 0;

        resolve(totalComission);
      } catch(error){
        console.log('Total commission Statistics service Error => ', error);
        reject({code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    })
  }

  /**
  * GET total due
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
  getTotalDue(filter = {}){
    return new Promise(async(resolve, reject) => {
      try{
        let totalDue = await Transaction.aggregate([
          { $match: {...filter, status: "approved", approvedAt: {$ne:null}} },
          { $group: { _id: 1, "total": {$sum: "$amountWOcommision"} }},
        ]);
        totalDue = totalDue[0] ? totalDue[0].total : 0;

        resolve(totalDue);
      } catch(error){
        console.log('Total Due Statistics service Error => ', error);
        reject({code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    })
  }

  getAccountsStatistics(){
    return new Promise(async(resolve, reject) => {
      try{
        const userService = new UserService();

        const totalUsers = await userService.getUserCount();
        const totalCompanies = await Company.countDocuments();
        const totalRiders = await Rider.countDocuments();

        resolve({
          totalUsers,
          totalCompanies,
          totalRiders,
        });
      } catch(error){
        console.log('Total revenue Statistics service Error => ', error);
        reject({code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    })
  }

  /**
  * GET transaction count
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
  getTransactionCount(filter = {}){
    return Transaction.countDocuments(filter);
  }
  /**
  * GET Rider count
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
  getRiderCount(filter = {}){
    return Rider.countDocuments(filter);
  }

  /**
    * GET total due
    * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
    */
  getTotalVehicles(){
    return Vehicle.countDocuments();
  }
}

module.exports = StatisticsService

