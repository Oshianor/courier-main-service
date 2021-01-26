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

function validateUserLogin(body) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(body);
}

function validateRiderLogin(body) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: passwordComplexity(complexityOptions).required(),
  });

  return schema.validate(body);
}

function validatePasswordUpdate(body) {
  const schema = Joi.object({
    oldPassword: passwordComplexity(complexityOptions).required(),
    newPassword: passwordComplexity(complexityOptions).required(),
  });

  return schema.validate(body);
}

function validateForgotPassword(body) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().max(4).optional(),
    password: passwordComplexity(complexityOptions).optional(),
  });

  return schema.validate(body);
}

function validateUserStatusUpdate(body) {
  const Schema = Joi.object().keys({
    account: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    status: Joi.string().valid("inactive", "active").required(),
  });

  return Schema.validate(body);
}


// NEW

function validateForgotPassword2(body) {
  const schema = Joi.object({
    email: Joi.string().email().label("Email").max(50).required(),
    userType: Joi.string().valid("rider","company").required(),
    verificationMode: Joi.string().valid("otp", "email").required(),
  });

  return schema.validate(body);
}

function validateResetPassword2(body) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    userType: Joi.string().valid("rider","company").required(),
    token: Joi.string().required(),
    password: passwordComplexity(complexityOptions).required(),
  });

  return schema.validate(body);
}

module.exports = {
  validateRiderLogin,
  validatePasswordUpdate,
  validateForgotPassword,
  validateUserLogin,
  validateUserStatusUpdate,
  validateForgotPassword2,
  validateResetPassword2
};
