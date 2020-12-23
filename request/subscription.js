const Joi = require("joi");

function validateSubscription(body) {
  const schema = Joi.object({
    pricing: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    duration: Joi.number().required(),
  });

  return schema.validate(body);
}

function validateUpdateubscription(body) {
  const schema = Joi.object({
    subscription: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    pricing: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    duration: Joi.number().optional(),
  });

  return schema.validate(body);
}

module.exports = {
  validateSubscription,
  validateUpdateubscription
};
