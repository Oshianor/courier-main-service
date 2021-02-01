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

function validateRider(body) {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    email: Joi.string().email().max(50).optional(),
    phoneNumber: Joi.string().max(10).required(),
    address: Joi.string().max(225).required(),
    DOB: Joi.date().required(),
    POIExpiringDate: Joi.date().required(),
    policyNumber: Joi.string().required(),
    plateNumber: Joi.string().max(15).required(),
    vehicle: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    ECName: Joi.string().max(30).required(),
    ECPhone: Joi.string().max(10).required(),
    ECEmail: Joi.string().email().max(50).required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
  });

  return schema.validate(body);
}

function validateRiderSelf(body) {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    email: Joi.string().email().max(50).optional(),
    phoneNumber: Joi.string().max(10).required(),
    address: Joi.string().max(225).required(),
    DOB: Joi.date().required(),
    POIExpiringDate: Joi.date().required(),
    policyNumber: Joi.string().required(),
    plateNumber: Joi.string().max(15).required(),
    vehicle: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    // company: Joi.string()
    //   .regex(/^[0-9a-fA-F]{24}$/)
    //   .required(),
    ECName: Joi.string().max(30).required(),
    ECPhone: Joi.string().max(10).required(),
    ECEmail: Joi.string().email().max(50).required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    // password: passwordComplexity(complexityOptions).required(),
    // confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });

  return schema.validate(body);
}

function validateUpdateRider(body) {
  const schema = Joi.object({
    name: Joi.string().optional(),
    address: Joi.string().optional(),
    DOB: Joi.date().optional(),
    proofOfIdentityExpireAt: Joi.date().optional(),
    policyNumber: Joi.string().optional(),
    plateNumber: Joi.string().optional(),
    ecName: Joi.string().optional(),
    ecPhone: Joi.string().optional(),
    ecEmail: Joi.string().email().optional(),
  });

  return schema.validate(body);
}

function validateRiderLogin(body) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });

  return schema.validate(body);
}


function validateRiderStatus(body) {
  const schema = Joi.object({
    status: Joi.string().valid("active", "suspended").required(),
  });

  return schema.validate(body);
}


function validateRiderLocation(body) {
  const schema = Joi.object({
    longitude: Joi.number().required(),
    latitude: Joi.number().required(),
  });

  return schema.validate(body);
}

function validateRiderFCMToken(body) {
  const schema = Joi.object({
    FCMToken: Joi.string().required(),
  });

  return schema.validate(body);
}

function validateEarningStatistics(body) {
  const schema = Joi.object({
    date: Joi.date().required()
  });

  return schema.validate(body);
}
module.exports = {
  validateRider,
  validateUpdateRider,
  validateRiderSelf,
  validateRiderLogin,
  validateRiderStatus,
  validateRiderLocation,
  validateRiderFCMToken,
  validateEarningStatistics
};
