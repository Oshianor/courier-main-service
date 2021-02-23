const Rating = require("../models/rating")
const Order = require("../models/order");
const { MSG_TYPES } = require("../constant/types");
const Rider = require("../models/rider");
const Company = require("../models/company");
const { populateMultiple } = require("../services/aggregate");

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
        body.company = order.company;
        const createRating = await Rating.create(body);

        await order.updateOne({ userRated: true, userRating: createRating._id });

        // calculate rider avarage rating
        const riderRating = await this.calculateRiderAverageRating(order.rider);
        const companyRating = await this.calculateCompanyAverageRating(order.company);

        await Rider.updateOne({ _id: order.rider }, { rating: riderRating });
        await Company.updateOne(
          { _id: order.company },
          { rating: companyRating }
        );

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
      let rating = await Rating.find(filter)
        .select("-_id user rating comment")
        // .populate("user", "-_id name email")
        .skip(skip)
        .limit(pageSize)
        .lean();

      rating = await populateMultiple(rating, "user", "-_id name email");

      if (rating.length < 1)
        return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

      resolve({ total, rating });
    });
  }


  /**
   * Get the average for a rider
   * @param {ObjectId} rider
   */
  calculateRiderAverageRating(rider) {
    return new Promise(async (resolve, reject) => {
      const star5 = await Rating.findOne({ rating: 5, rider, source: "user" }).countDocuments();
      const star4 = await Rating.findOne({ rating: 4, rider, source: "user" }).countDocuments();
      const star3 = await Rating.findOne({ rating: 3, rider, source: "user" }).countDocuments();
      const star2 = await Rating.findOne({ rating: 2, rider, source: "user" }).countDocuments();
      const star1 = await Rating.findOne({ rating: 1, rider, source: "user" }).countDocuments();

      const weight = star5 * 5 + star4 * 4 + star3 * 3 + star2 * 2 + star1 * 1;
      const total = star5 + star4 + star3 + star2 + star1;

      const average = weight / total;

      resolve(average);
    })
  }

    /**
   * Get the average for a company
   * @param {ObjectId} company
   */
  calculateCompanyAverageRating(company) {
    return new Promise(async (resolve, reject) => {
      const star5 = await Rating.findOne({ rating: 5, company }).countDocuments();
      const star4 = await Rating.findOne({ rating: 4, company }).countDocuments();
      const star3 = await Rating.findOne({ rating: 3, company }).countDocuments();
      const star2 = await Rating.findOne({ rating: 2, company }).countDocuments();
      const star1 = await Rating.findOne({ rating: 1, company }).countDocuments();

      const weight = star5 * 5 + star4 * 4 + star3 * 3 + star2 * 2 + star1 * 1;
      const total = star5 + star4 + star3 + star2 + star1;

      const average = weight / total;

      resolve(average);
    })
  }
}

module.exports = RatingService;