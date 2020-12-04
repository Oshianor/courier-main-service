const Rating = require("../models/rating")
const { MSG_TYPES } = require("../constant/types");

class RatingService {
  /**
 * Create a rating
 * @param {Object} ratingObject
 */
  createRating(ratingObject) {
    return new Promise(async (resolve, reject) => {
      try {
        const existingRating = await Rating.findOne({ source: ratingObject.source, entry: ratingObject.entry, user: ratingObject.user });
        if (existingRating) return reject({ code: 409, msg: MSG_TYPES.RATING_EXIST });
        const createRating = await Rating.create(ratingObject);
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

      const totalRating = await Rating.countDocuments(filter)
      const rating = await Rating.find(filter)
        .select('-_id user rating comment')
        .populate('user', '-_id name email')
        .skip(skip)
        .limit(pageSize);

      if (rating.length < 1) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

      resolve({ totalRating, rating });
    });
  }


}

module.exports = RatingService;