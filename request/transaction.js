const Joi = require("joi");

function validateTransaction(body) {
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
  });

  return schema.validate(body);
}

function validateTransactionStatus(body) {
  const schema = Joi.object({
    status: Joi.string().valid("approved", "declined").required(),
    entry: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  });

  return schema.validate(body);
}


module.exports = {
  validateTransaction,
  validateTransactionStatus,
};
