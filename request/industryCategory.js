const Joi = require("joi");

function validateIC(data) {
  const Schema = Joi.object().keys({
    name: Joi.string().max(50).label("Industry Name").required(),
  });

  return Schema.validate(data);
}

module.exports = {
  validateIC,
};
