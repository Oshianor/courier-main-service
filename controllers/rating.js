const RatingService = require("../services/rating");
const EntryService = require("../services/entry");
const { validateRiderID, validateRating } = require("../request/rating");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");

/**
 * Rate a user
 * @param {*} req 
 * @param {*} res 
 */
exports.rateUser = async (req, res) => {
  try {

    const entryInstance = new EntryService();
    const entry = await entryInstance.get({ _id: req.body.entry }, 'user');
    const ratingObj = {
      rider: req.user.id,
      user: `${entry.user}`,
      source: req.body.source,
      entry: req.body.entry,
      rating: req.body.rating,
      comment: req.body.comment || 'No comment'
    }
    const { error } = validateRating(ratingObj);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    const ratingInstance = new RatingService();
    await ratingInstance.createRating(ratingObj);
    JsonResponse(res, 200, MSG_TYPES.RATING_DONE);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Get rider ratings 
 * @param {*} req 
 * @param {*} res 
 */
exports.getAllRiderRatings = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const { error } = validateRiderID({ rider: req.user.id });
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const ratingInstance = new RatingService();
    const { totalRating, rating } = await ratingInstance.getAllRatings({ rider: req.user.id, source: 'user' }, skip, pageSize);

    const meta = {
      totalRating,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, rating, meta);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};
