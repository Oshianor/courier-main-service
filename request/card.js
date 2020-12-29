const Joi = require("joi");


function validateCard(user) {
  const Schema = Joi.object().keys({
    company: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    txRef: Joi.string().required(),
  });
  return Schema.validate(user);
}

function validateCardId(cardId) {
  const Schema = Joi.object().keys({
    cardId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });
  return Schema.validate(cardId);
}

module.exports = {
  validateCard,
  validateCardId
};
