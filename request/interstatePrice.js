const Joi = require("joi");

function validateInterstatePrice(data) {
    const Schema = Joi.object().keys({
        originCountry: Joi.string().label("Origin country").required(),
        originState: Joi.string().label("Origin State").required(),
        destinationCountry: Joi.string().label("destination country").required(),
        destinationState: Joi.string().label("destination State").required(),
        company: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label("Company").required(),
        organization: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label("Organization").required(),
        price: Joi.string().label("Price").required(),
        currency: Joi.string().label("Currency").required(),
        source: Joi.string().label("Source").required()
    });

    return Schema.validate(data);
}

function validateUpdateInterstatePrice(data) {
    const Schema = Joi.object().keys({
        originCountry: Joi.string().label("Origin country").required(),
        originState: Joi.string().label("Origin State").required(),
        destinationCountry: Joi.string().label("destination country").required(),
        destinationState: Joi.string().label("destination State").required(),
        company: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label("Company").required(),
        organization: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label("Organization").required(),
        price: Joi.string().label("Price").required(),
        currency: Joi.string().label("Currency").required(),
        source: Joi.string().label("Source").required()
    });

    return Schema.validate(data);
}

function validateCompanyInterstatePrice(data) {
    const Schema = Joi.object().keys({
        destinationCountry: Joi.string().label("destination country").required(),
        destinationState: Joi.string().label("destination State").required(),
        price: Joi.string().label("Price").required(),
        currency: Joi.string().label("Currency").required(),
        source: Joi.string().label("Source").required()
    });

    return Schema.validate(data);
}

function validateUpdateCompanyInterstatePrice(data) {
    const Schema = Joi.object().keys({
        destinationCountry: Joi.string().label("destination country").required(),
        destinationState: Joi.string().label("destination State").required(),
        price: Joi.string().label("Price").required(),
        currency: Joi.string().label("Currency").required(),
        source: Joi.string().label("Source").required(),
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).label("id").required(),

    });

    return Schema.validate(data);
}

module.exports = {
    validateInterstatePrice,
    validateUpdateInterstatePrice,
    validateCompanyInterstatePrice,
    validateUpdateCompanyInterstatePrice
};
