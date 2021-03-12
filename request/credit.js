const Joi = require("joi");

function validateRequestFund(data) {
  const Schema = Joi.object().keys({
    amount: Joi.number()
      .required(),
  });

  return Schema.validate(data);
}

function validateAppproveLoan(data) {
  const Schema = Joi.object().keys({
    status: Joi.string().valid("approved", "declined").required(),
    credit: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    note: Joi.string().when('status', {
      is: "declined",
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    }),
  });

  return Schema.validate(data);
}


module.exports = {
  validateRequestFund,
  validateAppproveLoan,
};
