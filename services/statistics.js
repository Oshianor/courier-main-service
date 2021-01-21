
const mongoose = require("mongoose");
const Transaction = require("../models/transaction");
const { convertToMonthlyDataArray, isObject } = require("../utils");
const { MSG_TYPES } = require("../constant/types");
const Order = require("../models/order");
const Rider = require("../models/rider");
const Enterprise = require("../models/enterprise");
const CreditHistory = require("../models/creditHistory");
const { reject } = require("bcrypt/promises");
const { ObjectId } = mongoose.Types;


class StatisticsService {
  constructor(){
    this.successfulDeliveryFilter = { status: "delivered" }
    this.failedDeliveryFilter = { status: "canceled" }
    this.pendingDeliveryFilter = { status: "pending" }
    this.approvedCreditFilter = { type: "loan", status: "approved"}
    this.declinedCreditFilter = { type: "loan", status: "declined"}
  }

  /**
  * GET platform statistics - revenue, orders, riders summary
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
  getGeneralStatistics(filter = {}) {
    return new Promise(async (resolve, reject) => {
      try {

        const deliveryStatistics = await this.getDeliveryStatistics(filter);
        const totalRevenue = await this.getTotalRevenue(filter);
        const totalRiders = await Rider.countDocuments({...filter});

        // Coercing to ObjectIds because the $match stage of the aggregation needs it that way
        if(filter.enterprise && typeof(filter.enterprise) === 'string'){
          filter.enterprise = ObjectId(filter.enterprise);
        }
        if(filter.company && typeof(filter.company) === 'string'){
          filter.company = ObjectId(filter.company);
        }

        // Total deliveries by months
        let monthlySuccessfulDeliveries = await Order.aggregate(
          buildOrderAggregationPipeline({...filter, ...this.successfulDeliveryFilter})
        );
        let monthlyFailedDeliveries = await Order.aggregate(
          buildOrderAggregationPipeline({...filter, ...this.failedDeliveryFilter})
        );
        monthlySuccessfulDeliveries = convertToMonthlyDataArray(monthlySuccessfulDeliveries, 'numberOfDeliveries');
        monthlyFailedDeliveries = convertToMonthlyDataArray(monthlyFailedDeliveries, 'numberOfDeliveries');



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

        if(filter.enterprise && typeof(filter.enterprise) === 'string'){
          const enterpriseRecord = await Enterprise.findOne({_id: filter.enterprise});
          if(enterpriseRecord){
            statisticsData.totalBranches = enterpriseRecord.branchUserIDS.length;
            statisticsData.totalManagers = enterpriseRecord.maintainers.length;
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

      const totalAdmins = await Enterprise.countDocuments({type: "owner"});
      const totalMaintainers = await Enterprise.countDocuments({type: "maintainer"});
      const totalBranches = await Enterprise.countDocuments({type: "branch"});

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

      console.log(monthlyDeclinedCredits, monthlyApprovedCredits)
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

        resolve({
          totalDeliveries,
          totalFailedDeliveries,
          totalSuccessfulDeliveries,
          totalPendingDeliveries
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
}

module.exports = StatisticsService

