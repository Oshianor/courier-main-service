const Order = require("../models/order");
const { MSG_TYPES } = require("../constant/types");


class OrderService {
  /**
   * Get a single Order
   * @param {Object} filter
   * @param {Object} option
   * @param {String} populate
   */
  get(filter = {}, option = {}, populate = "") {
    return new Promise(async (resolve, reject) => {
      // check if we have pricing for the location
      const order = await Order.findOne(filter)
        .select(option)
        .populate(populate);

      if (!order) {
        reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
      }

      resolve(order);
    });
  }

  /**
   * Get multiple Orders
   * @param {Object} filter
   * @param {Object} option
   * @param {String} populate
   */
  getAll(filter = {}, option = {}, populate = "") {
    return new Promise(async (resolve, reject) => {
      try {
        // check if we have pricing for the location
        const order = await Order.find(filter)
          .select(option)
          .populate(populate);

        resolve(order);
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Update Mutiple Orders
   * @param {Object} filter
   * @param {Object} set
   */
  updateAll(filter = {}, set = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if we have pricing for the location
        const order = await Order.updateMany(filter, set);

        if (order) {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
          return;
        }

        resolve(order);
      } catch (error) {
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }
}

module.exports = OrderService;
