const Joi = require("joi");


function validateLocalEntry(data) {
  const Schema = Joi.object().keys({
    email: Joi.string().email().max(50).label("Email").required(),
    itemType: Joi.string()
      .label("Item Type")
      .valid("Document", "Parcel", "Edible")
      .required(),
    name: Joi.string().label("Name").required(),
    pickupTime: Joi.date().label("Pick Up Time").required(),
    pickupLatitude: Joi.number().label("Pick Up Latitude").required(),
    pickupLongitude: Joi.number().label("Pick Up Longitude").required(),
    description: Joi.string().label("Description").required(),
    vehicle: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .label("Vehicle")
      .required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    city: Joi.string().label("City").optional(),
    postCode: Joi.string().label("Post Code").optional(),
    phoneNumber: Joi.string().max(10).required(),
    countryCode: Joi.string().max(5).required(),
    img: Joi.array()
      .items(
        Joi.string()
          .base64({ paddingRequired: false })
          .label("Item Image")
          .required()
      )
      .max(4)
      .optional(),
    delivery: Joi.array()
      .items({
        email: Joi.string().email().max(50).label("Email").required(),
        phoneNumber: Joi.string().max(10).required(),
        countryCode: Joi.string().max(5).required(),
        name: Joi.string().label("Name").required(),
        itemName: Joi.string().label("Item Name").required(),
        deliveryLatitude: Joi.number().label("Delivery Latitude").required(),
        deliveryLongitude: Joi.number().label("Delivery Longitude").required(),
        country: Joi.string().label("Country").required(),
        state: Joi.string().label("State").required(),
        city: Joi.string().label("City").optional(),
        postCode: Joi.string().label("Post Code").optional(),
        weight: Joi.number().label("Weight").required(),
        quantity: Joi.number().label("Quantity").required(),
      })
      .max(10)
      .required(),
  });

  return Schema.validate(data);
}

function validateEntryID(data) {
  const Schema = Joi.object().keys({
    entry: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });

  return Schema.validate(data);
}

function validatePickupOTP(data) {
  const Schema = Joi.object().keys({
    OTPCode: Joi.string().min(4).max(4).required(),
    entry: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });

  return Schema.validate(data);
}


module.exports = {
  validateLocalEntry,
  validateEntryID,
  validatePickupOTP,
};
