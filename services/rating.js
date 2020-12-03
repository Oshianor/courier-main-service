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
 * @param {Number} pageNumber 
 * @param {Number} nPerPage
 */
  getAllRatings(filter = {}, pageNumber, nPerPage) {
    return new Promise(async (resolve, reject) => {
      if (!nPerPage) nPerPage = 10;
      const totalRating = await Rating.countDocuments(filter)
      const rating = await Rating.find(filter)
        .select('-_id user rating comment')
        .populate('user', '-_id name email')
        .skip(pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0)
        .limit(nPerPage)
      if (rating.length < 1) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });
      resolve({ totalRating, rating });
    });
  }


}

module.exports = RatingService;