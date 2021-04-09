const Joi = require("joi");

function validateInterstatePrice(data) {
  const Schema = Joi.object().keys({
    originCountry: Joi.string().label("Origin country").required(),
    originState: Joi.string().label("Origin State").required(),
    destinationCountry: Joi.string().valid(Joi.ref("originCountry")).required(),
    destinationState: Joi.string().label("destination State").required(),
    price: Joi.number().label("Price").required(),
    location: Joi.array()
      .items({
        address: Joi.string().label("Address").required(),
        name: Joi.string().label("Name").required(),
        email: Joi.string().email().max(50).label("Email").optional(),
        phoneNumber: Joi.string()
          .regex(/^[1-9][0-9]{9}$/)
          .required()
          .messages({
            "string.pattern.base": `Phone Number can't not have a leading zero (0)`,
          }),
        countryCode: Joi.string().max(5).required(),
      })
      .required(),
  });

  return Schema.validate(data);
}

function validateUpdateInterstatePrice(data) {
  const Schema = Joi.object().keys({
    originCountry: Joi.string().label("Origin country").required(),
    originState: Joi.string().label("Origin State").required(),
    destinationCountry: Joi.string().label("destination country").required(),
    destinationState: Joi.string().label("destination State").required(),
    price: Joi.number().label("Price").required(),
    location: Joi.array()
      .items({
        address: Joi.string().label("Address").required(),
        name: Joi.string().label("Name").required(),
        email: Joi.string().email().max(50).label("Email").optional(),
        phoneNumber: Joi.string()
          .regex(/^[1-9][0-9]{9}$/)
          .required()
          .messages({
            "string.pattern.base": `Phone Number can't not have a leading zero (0)`,
          }),
        countryCode: Joi.string().max(5).required(),
      })
      .required(),
  });

  return Schema.validate(data);
}

function validateCompanyInterstatePrice(data) {
  const Schema = Joi.object().keys({
    destinationCountry: Joi.string().label("destination country").required(),
    destinationState: Joi.string().label("destination State").required(),
    price: Joi.number().label("Price").required(),
    location: Joi.array()
      .items({
        address: Joi.string().label("Address").required(),
        name: Joi.string().label("Name").required(),
        email: Joi.string().email().max(50).label("Email").optional(),
        phoneNumber: Joi.string()
          .regex(/^[1-9][0-9]{9}$/)
          .required()
          .messages({
            "string.pattern.base": `Phone Number can't not have a leading zero (0)`,
          }),
        countryCode: Joi.string().max(5).required(),
      })
      .required(),
  });

  return Schema.validate(data);
}

function validateUpdateCompanyInterstatePrice(data) {
  const Schema = Joi.object().keys({
    destinationCountry: Joi.string().label("destination country").required(),
    destinationState: Joi.string().label("destination State").required(),
    price: Joi.number().label("Price").required(),
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .label("id")
      .required(),
    location: Joi.array()
      .items({
        address: Joi.string().label("Address").required(),
        name: Joi.string().label("Name").required(),
        email: Joi.string().email().max(50).label("Email").optional(),
        phoneNumber: Joi.string()
          .regex(/^[1-9][0-9]{9}$/)
          .required()
          .messages({
            "string.pattern.base": `Phone Number can't not have a leading zero (0)`,
          }),
        countryCode: Joi.string().max(5).required(),
      })
      .required(),
  })


  return Schema.validate(data);
}

module.exports = {
  validateInterstatePrice,
  validateUpdateInterstatePrice,
  validateCompanyInterstatePrice,
  validateUpdateCompanyInterstatePrice,
};
