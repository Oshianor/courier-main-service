const Joi = require("joi");

function validateVehicle(data) {
  const Schema = Joi.object().keys({
    type: Joi.string().max(30).label("Vehicle Type").required(),
    weight: Joi.number().label("Weight").required(),
  });

  return Schema.validate(data);
}

function validateUpdateVehicle(data) {
  const Schema = Joi.object().keys({
    weight: Joi.number().label("Weight").required(),
    type: Joi.string().max(30).label("Vehicle Type").optional(),
  });

  return Schema.validate(data);
}


module.exports = {
  validateVehicle,
  validateUpdateVehicle,
};
