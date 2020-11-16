const Joi = require("joi");

function validateDistancePrice(data) {
  const Schema = Joi.object().keys({
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    vehicle: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label("Vehicle").required(),
    price: Joi.number().label("Distance Per Price").required()
  });

  return Schema.validate(data);
}


function validateDistancePriceCompany(data) {
  const Schema = Joi.object().keys({
    vehicle: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label("Vehicle").required(),
    price: Joi.number().label("Distance Per Price").required(),
  });

  return Schema.validate(data);
}


function validateUpdateDistancePrice(data) {
  const Schema = Joi.object().keys({
    price: Joi.number().label("Distance Per Price").required(),
  });

  return Schema.validate(data);
}


module.exports = {  
  validateDistancePrice,
  validateUpdateDistancePrice,
  validateDistancePriceCompany,
};
