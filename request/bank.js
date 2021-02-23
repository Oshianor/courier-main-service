const Joi = require("joi");

//validate bank detail
function validateBankDetail(body) {
  const schema = Joi.object({
    rider: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    accountNumber: Joi.string().max(10).required(),
    accountName: Joi.string().max(100).required(),
    bankName: Joi.string().max(100).required(),
    bankCode: Joi.string().max(4),
    default: Joi.boolean().required(),
  })

  return schema.validate(body);
}

function validateResolveBankAccount(data) {
  console.log(data)
  const schema = Joi.object({
    accountNumber: Joi.string().required(),
    bankCode: Joi.string().required()
  })

  return schema.validate(data);
}

module.exports = {
  validateBankDetail,
  validateResolveBankAccount
};