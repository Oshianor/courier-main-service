const Joi = require("joi");


function validateUserID(data) {
  const Schema = Joi.object().keys({
    user: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });
  return Schema.validate(data);
}

function validateRatingID(data) {
  const Schema = Joi.object().keys({
    rating: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });
  return Schema.validate(data);
}

function validateRating(data) {
  const Schema = Joi.object().keys({
    ratingFrom: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    ratingTo: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    order: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    rating: Joi.number().integer().min(1).max(10).required(),
    comment: Joi.string()
  });

  return Schema.validate(data);
}

module.exports = {
  validateUserID,
  validateRatingID,
  validateRating
};
