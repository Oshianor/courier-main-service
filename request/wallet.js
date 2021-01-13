const Joi = require("joi");

function validateFundWallet(data) {
  const Schema = Joi.object().keys({
    card: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    amount: Joi.number()
      .required(),
  });

  return Schema.validate(data);
}


module.exports = {
  validateFundWallet,
};
