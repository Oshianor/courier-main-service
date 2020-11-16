const Joi = require("joi");

function validatePricing(data) {
  const Schema = Joi.object().keys({
    name: Joi.string().max(30).label("Plan name").required(),
    features: Joi.array().min(0).label("Plan features").required(),
    priority: Joi.number().min(0).label("Priority").required(),
    transactionCost: Joi.number().min(0).label("Transaction Cost").required(),
    price: Joi.number().min(0).label("Price").required(),
    currency: Joi.string().min(0).label("Format").valid("NGN").required(),
    type: Joi.string()
      .min(0)
      .label("Type")
      .valid("freemium", "premium")
      .required(),
  });

  return Schema.validate(data);
}


function validateUpdatePricing(data) {
  const Schema = Joi.object().keys({
    name: Joi.string().max(30).label("Plan name").optional(),
    features: Joi.array().min(0).label("Plan features").optional(),
    priority: Joi.number().min(0).label("Priority").optional(),
    transactionCost: Joi.number().min(0).label("Transaction Cost").optional(),
    price: Joi.number().min(0).label("Price").optional(),
    currency: Joi.string().min(0).label("Format").valid("NGN").optional(),
    type: Joi.string()
      .min(0)
      .label("Type")
      .valid("freemium", "premium")
      .optional(),
  });

  return Schema.validate(data);
}

module.exports = {
  validatePricing,
  validateUpdatePricing,
};
