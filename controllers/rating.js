const RatingService = require("../services/rating");
const EntryService = require("../services/entry");
const { validateRiderID, validateRating } = require("../request/rating");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");

/**
 * Rate a user/rider
 * @param {*} req 
 * @param {*} res 
 */
exports.rateUser = async (req, res, next) => {
  try {
    const { error } = validateRating(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const ratingInstance = new RatingService();
    await ratingInstance.createUserRating(req.body, req.user);

    JsonResponse(res, 200, MSG_TYPES.RATING_DONE);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Get rider ratings 
 * @param {*} req 
 * @param {*} res 
 */
exports.getAllRiderRatings = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const { error } = validateRiderID({ rider: req.user.id });
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const ratingInstance = new RatingService();
    const { total, rating } = await ratingInstance.getAllRatings(
      { rider: req.user.id, source: "user" },
      skip,
      pageSize
    );

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, rating, meta);
    return;
  } catch (error) {
        next(error);
  }
};
