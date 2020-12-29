const Joi = require("joi");

function validateSubscription(body) {
  const schema = Joi.object({
    company: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    pricing: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    duration: Joi.number().required(),
  });

  return schema.validate(body);
}

function validateUpdateubscription(body) {
  const schema = Joi.object({
    company: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    card: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    pricing: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    startEndOfCurrentPlan: Joi.boolean().optional()
  });

  return schema.validate(body);
}

module.exports = {
  validateSubscription,
  validateUpdateubscription
};
