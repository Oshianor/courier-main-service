const Joi = require("joi");


function validateRiderID(data) {
  const Schema = Joi.object().keys({
    rider: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });
  return Schema.validate(data);
}

function validateRating(data) {
  const Schema = Joi.object().keys({
    source: Joi.string().valid("rider", "user").required(),
    order: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().allow("").max(225).optional()
  });

  return Schema.validate(data);
}

module.exports = {
  validateRiderID,
  validateRating
};
