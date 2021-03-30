const Joi = require("joi");

function validateTransaction(body) {
  const schema = Joi.object({
    paymentMethod: Joi.string()
      .valid("cash", "card")
      .required(),
    entry: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    pickupType: Joi.string()
      .label("Pickup Type")
      .valid("instant", "anytime")
      .required(),
    card: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .when("paymentMethod", {
        is: "card",
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    cashPaymentType: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .when("paymentMethod", {
        is: "cash",
        then: Joi.string().valid("pickup", "delivery").required(),
        otherwise: Joi.forbidden(),
      }),
  });

  return schema.validate(body);
}

function validateEnterpriseTransaction(body) {
  const schema = Joi.object({
    paymentMethod: Joi.string()
      .valid("cash", "card", "wallet", "credit")
      .required(),
    entry: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    pickupType: Joi.string()
      .label("Pickup Type")
      .valid("instant", "anytime")
      .required(),
    card: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .when("paymentMethod", {
        is: "card",
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    cashPaymentType: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .when("paymentMethod", {
        is: "cash",
        then: Joi.string().valid("pickup", "delivery").required(),
        otherwise: Joi.forbidden(),
      }),
  });

  return schema.validate(body);
}

function validateTransactionStatus(body) {
  const schema = Joi.object({
    status: Joi.string().valid("approved", "declined").required(),
    type: Joi.string().valid("pickup","delivery").required(),
    entry: Joi.when('type', {
      is: "pickup",
      then: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      otherwise: Joi.forbidden()
    }),
    order: Joi.when('type', {
      is: "delivery",
      then: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      otherwise: Joi.forbidden()
    })
  });

  return schema.validate(body);
}


module.exports = {
  validateTransaction,
  validateTransactionStatus,
  validateEnterpriseTransaction,
};
