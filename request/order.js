const Joi = require("joi");


function validateOrderID(data) {
  const Schema = Joi.object().keys({
    order: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });

  return Schema.validate(data);
}

function validateOrderOTP(data) {
  const Schema = Joi.object().keys({
    OTPCode: Joi.string().min(4).max(4).required(),
    order: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });

  return Schema.validate(data);
}

function validateUserOrderID(data) {
  const Schema = Joi.object().keys({
    orderId: Joi.string().regex(/^[-0-9a-zA-Z_]{8}$/).required(),
  });

  return Schema.validate(data);
}

module.exports = {
  validateOrderID,
  validateOrderOTP,
  validateUserOrderID
};
