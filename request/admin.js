const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const complexityOptions = {
  min: 6,
  max: 20,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 2,
};

// validate create company
function validateAdmin(body) {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    email: Joi.string().max(50).email().required(),
    role: Joi.string().required().valid("superAdmin", "admin", "accountant"),
    country: Joi.string().max(30).required(),
    state: Joi.string().max(50).required(),
    phoneNumber: Joi.string().min(10).max(10).required(),
  });

  return schema.validate(body);
}

function validateUpdateAdmin(body) {
  const schema = Joi.object({
    name: Joi.string().max(30).optional(),
    address: Joi.string().optional(),
  });

  return schema.validate(body);
}

function validatePassword(body) {
  const schema = Joi.object({
    oldPassword: passwordComplexity(complexityOptions).required(),
    password: passwordComplexity(complexityOptions).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });

  return schema.validate(body);
}

function validateAdminLogin(body) {
  const adminSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });

  return adminSchema.validate(body);
}

// validate company verification
function validateVerifyAccount(body) {
  const schema = Joi.object({
    email: Joi.string().email().max(50).required(),
    token: Joi.string().max(225).required(),
    type: Joi.string().valid("admin", "company", "rider").required(),
    password: passwordComplexity(complexityOptions).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });

  return schema.validate(body);
}


function validateGetEnterpriseAccounts(body) {
  const schema = Joi.object({
    role: Joi.string().valid("owner","branch","maintainer").required(),
  });

  return schema.validate(body);
}

module.exports = {
  validateAdmin,
  validateAdminLogin,
  validateVerifyAccount,
  validateUpdateAdmin,
  validatePassword,
  validateGetEnterpriseAccounts
};