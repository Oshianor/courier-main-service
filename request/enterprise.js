const Joi = require("joi");

function validateEnterprise(body) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    type: Joi.string().valid("owner", "branch", "maintainer").required(),
    phoneNumber: Joi.string().required(),
    countryCode: Joi.string().required(),
    address: Joi.string().required(),
    primaryColors: Joi.array().items(Joi.string().optional()).optional(),
    secondaryColors: Joi.array().items(Joi.string().optional()).optional(),
    motto: Joi.string().required(),
    industry: Joi.string().required(),
    createdBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    logo: Joi.string().optional(),
    enterprise: Joi.optional(),
    owner: Joi.optional(),
    branch: Joi.optional()
  });

  return schema.validate(body);
}

function validateEnterpriseUpdate(body) {
  const schema = Joi.object({
    name: Joi.string().optional(),
    address: Joi.string().optional(),
    primaryColors: Joi.array().items(Joi.string().optional()).optional(),
    secondaryColors: Joi.array().items(Joi.string().optional()).optional(),
    motto: Joi.string().optional(),
    industry: Joi.string().optional(),
    logo: Joi.string().optional(),
    enterprise: Joi.optional(),
    owner: Joi.optional(),
    branch: Joi.optional()
  });

  return schema.validate(body);
}


function validateMaintainer(body) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    countryCode: Joi.string().required(),
    address: Joi.string().required(),
    type: Joi.string().valid("owner", "branch", "maintainer").required()
  });

  return schema.validate(body);
}


module.exports = {
  validateEnterprise,
  validateMaintainer,
  validateEnterpriseUpdate
};
