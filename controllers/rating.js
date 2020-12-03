const RatingService = require("../services/rating");
const { validateUserID, validateRatingID, validateRating } = require("../request/rating");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");



/**
 * Rate a user
 * @param {*} req 
 * @param {*} res 
 */
exports.rateUser = async (req, res) => {
  try {
    const { error } = validateRating(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    const ratingInstance = new RatingService();
    await ratingInstance.createRating(req.body);
    JsonResponse(res, 200, MSG_TYPES.RATING_DONE);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Get my rating 
 * @param {*} req 
 * @param {*} res 
 */
exports.getOneRating = async (req, res) => {
  try {
    const { error } = validateRatingID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    const ratingInstance = new RatingService();
    const rating = await ratingInstance.getOneRating({ _id: req.body.rating });
    JsonResponse(res, 200, MSG_TYPES.RATING_RETRIEVED, rating);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};


/**
 * Get my rating 
 * @param {*} req 
 * @param {*} res 
 */
exports.getAllRatings = async (req, res) => {
  try {
    const { error } = validateUserID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    const ratingInstance = new RatingService();
    const rating = await ratingInstance.getAllRatings({ ratingTo: req.body.user });
    JsonResponse(res, 200, 'Ratings retrieved successfully', rating);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};