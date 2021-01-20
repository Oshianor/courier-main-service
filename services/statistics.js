
const mongoose = require("mongoose");
const Transaction = require("../models/transaction");
const { convertToMonthlyDataArray } = require("../utils");
const { MSG_TYPES } = require("../constant/types");
const Order = require("../models/order");
const Rider = require("../models/rider");
const Enterprise = require("../models/enterprise");
const { ObjectId } = mongoose.Types;


class StatisticsService {
  /**
  * GET a company's statistics - revenue, orders, riders summary
  * @param {Object} filter - { company: ObjectId } | { enterprise: ObjectId } | {}
  */
  getGeneralStatistics(filter = {}) {
    return new Promise(async (resolve, reject) => {
      try {

        const successfulDeliveryFilter = {
          ...filter,
          status: "delivered"
        }

        const failedDeliveryFilter = {
          ...filter,
          status: "canceled"
        }
        const pendingDeliveryFilter = {
          ...filter,
          status: "pending"
        }

        const totalDeliveries = await Order.countDocuments({...filter});
        const totalPendingDeliveries = await Order.countDocuments({...pendingDeliveryFilter});
        const totalFailedDeliveries = await Order.countDocuments({...failedDeliveryFilter});
        const totalSuccessfulDeliveries = await Order.countDocuments({...successfulDeliveryFilter});

        const totalRiders = await Rider.countDocuments({...filter});

        // Coercing to ObjectIds because the $match stage of the aggregation needs it that way
        if(filter.enterprise){
          filter.enterprise = ObjectId(filter.enterprise);
        }
        if(filter.company){
          filter.company = ObjectId(filter.company);
        }

        // Total deliveries by months
        let monthlySuccessfulDeliveries = await Order.aggregate(buildOrderAggregationPipeline(successfulDeliveryFilter));
        let monthlyFailedDeliveries = await Order.aggregate(buildOrderAggregationPipeline(failedDeliveryFilter));
        monthlySuccessfulDeliveries = convertToMonthlyDataArray(monthlySuccessfulDeliveries, 'numberOfDeliveries');
        monthlyFailedDeliveries = convertToMonthlyDataArray(monthlyFailedDeliveries, 'numberOfDeliveries');

        let totalRevenue = await Transaction.aggregate([
          { $match: {...filter, status: "approved", approvedAt: {$ne:null}} },
          { $group: { _id: 1, "total": {$sum: "$amount"} }},
        ]);
        totalRevenue = totalRevenue[0] ? totalRevenue[0].total : 0;

        let monthlyRevenues = await Transaction.aggregate([
          { $match: {...filter, status: "approved"} },
          { $group:{ _id: {$month: "$approvedAt"}, revenue: {$sum: "$amount"}} },
          { $project: {_id:0, "month": "$_id", revenue: "$revenue"}}
        ]);
        monthlyRevenues = convertToMonthlyDataArray(monthlyRevenues, "revenue");


        const statisticsData = {
          totalDeliveries,
          totalPendingDeliveries,
          totalFailedDeliveries,
          totalSuccessfulDeliveries,
          totalRiders,
          totalRevenue,
          monthlyFailedDeliveries,
          monthlySuccessfulDeliveries,
          monthlyRevenues,
        }

        if(filter.enterprise){
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
        return reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
      }
    })
  }
}

module.exports = StatisticsService

