const Rating = require("../models/rating")
const Order = require("../models/order");
const { MSG_TYPES } = require("../constant/types");

class RatingService {
  /**
   * Create a rating
   * @param {Object} body
   * @param {Object} user
   */
  createUserRating(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const order = await Order.findOne({
          _id: body.order,
          status: "delivered",
          user: user.id,
        });
        if (!order) return reject({ code: 404, msg: "No order was found" });

        const rating = await Rating.findOne({
          source: "user",
          order: body.order,
          user: user.id,
        });

        if (rating) return reject({ code: 409, msg: MSG_TYPES.RATING_EXIST });

        body.user = user.id;
        body.rider = order.rider;
        const createRating = await Rating.create(body);

        await order.updateOne({ userRated: true, userRating: createRating._id });

        resolve(createRating);
      } catch (error) {
        console.log("error", error);
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Get a user Rating
   * @param {Object} filter
   * @param {Number} skip
   * @param {Number} pageSize
   */
  getAllRatings(filter = {}, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      const total = await Rating.countDocuments(filter);
      const rating = await Rating.find(filter)
        .select("-_id user rating comment")
        .populate("user", "-_id name email")
        .skip(skip)
        .limit(pageSize);

      if (rating.length < 1)
        return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

      resolve({ total, rating });
    });
  }
}

module.exports = RatingService;