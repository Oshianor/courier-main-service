const Joi = require("joi");

function validateEnterprise(body) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    type: Joi.string().valid("HQ", "Branch").required(),
    phoneNumber: Joi.string().required(),
    countryCode: Joi.string().required(),
    address: Joi.string().required(),
    primaryColors: Joi.array().items(Joi.string().optional()).optional(),
    secondaryColors: Joi.array().items(Joi.string().optional()).optional(),
    motto: Joi.string().required(),
    industry: Joi.string().required(),
    createdBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    logo: Joi.string().optional(),
  });

  return schema.validate(body);
}


function validateMaintainer(body) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    countryCode: Joi.string().required(),
    createdBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
  });

  return schema.validate(body);
}


module.exports = {
  validateEnterprise,
  validateMaintainer
};
