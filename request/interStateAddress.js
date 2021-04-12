const Joi = require("joi");

function validateInterstateAddress(data) {
  const Schema = Joi.object().keys({
    address: Joi.string().label("address").required(),
    name: Joi.string().label("name").required(),
    email: Joi.string().label("email").required(),
    phoneNumber: Joi.string().label("phoneNumber ").required(),
    countryCode: Joi.string().label("countryCode").required(),
    country: Joi.string().label("country").required(),
    state: Joi.string().label("state").required(),
  });

  return Schema.validate(data);
}

module.exports = {
  validateInterstateAddress,

};
