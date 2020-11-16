const Joi = require("joi");


function validateStatusUpdate(body) {
  const schema = Joi.object({
    status: Joi.string().required().valid("pending", "approved", "declined"),
  });

  return schema.validate(body);
}

module.exports = {
  validateStatusUpdate,
};
