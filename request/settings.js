const Joi = require("joi");

function validateSettings(data) {
  const Schema = Joi.object().keys({
    weightPrice: Joi.number().label("Weight Price").required(),
    documentPrice: Joi.number().label("Document Price").required(),
    parcelPrice: Joi.number().label("Parcel Price").required(),
    ediblePrice: Joi.number().label("Edible Price").required(),
    baseFare: Joi.number().required(),
    recruitment: Joi.boolean().required(),
  });

  return Schema.validate(data);
}


function validateUpdateSettings(data) {
  const Schema = Joi.object().keys({
    weightPrice: Joi.number().label("Weight Price").optional(),
    documentPrice: Joi.number().label("Document Price").optional(),
    parcelPrice: Joi.number().label("Parcel Price").optional(),
    ediblePrice: Joi.number().label("Edible Price").optional(),
    baseFare: Joi.number().optional(),
    recruitment: Joi.boolean().optional(),
  });

  return Schema.validate(data);
}



module.exports = {
  validateSettings,
  validateUpdateSettings,
};
