const Joi = require("joi");


function validateStatusUpdate(body) {
  const schema = Joi.object({
    status: Joi.string().required().valid("approved", "declined"),
  });

  return schema.validate(body);
}

module.exports = {
  validateStatusUpdate,
};

