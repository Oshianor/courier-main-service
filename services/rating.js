const Rating = require("../models/rating")
const { MSG_TYPES } = require("../constant/types");

class RatingService {
  /**
 * Create a rating
 * @param {ObjectID} from
 * @param {ObjectID} to
 * @param {ObjectID} order
 * @param {Number} rating
 * @param {String} comment

 */
  createRating({ ratingFrom, ratingTo, order, rating, comment }) {
    return new Promise(async (resolve, reject) => {
      try {
        const existingRating = await Rating.findOne({ ratingFrom: ratingFrom, ratingTo: ratingTo, order: order });
        if (existingRating) return reject({ code: 409, msg: MSG_TYPES.RATING_EXIST });
        const createRating = await Rating.create({ ratingFrom, ratingTo, order, rating, comment });
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
   */
  getOneRating(filter = {}) {
    return new Promise(async (resolve, reject) => {
      // check if we have pricing for the location
      const rating = await Rating.findOne(filter)
        .select('-_id order rating ratingFrom comment ')
        .populate('order', '-_id status itemName quantity weight pickupAddress deliveryAddress')
        .populate('ratingFrom', '-_id name email phoneNumber');

      if (!rating) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

      resolve(rating);
    });
  }


  /**
 * Get a user Rating
 * @param {Object} filter
 */
  getAllRatings(filter = {}) {
    return new Promise(async (resolve, reject) => {
      // check if we have pricing for the location
      const rating = await Rating.find(filter)
        .select('order rating ratingFrom comment ')
        .populate('order', '-_id status itemName quantity weight pickupAddress deliveryAddress')
        .populate('ratingFrom', '-_id name email phoneNumber');

      if (rating.length < 1) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

      resolve(rating);
    });
  }


}

module.exports = RatingService;