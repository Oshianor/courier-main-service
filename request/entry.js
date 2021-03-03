const Joi = require("joi");


function validateLocalEntry(data) {
  const Schema = Joi.object().keys({
    email: Joi.string().email().max(50).label("Email").optional(),
    itemType: Joi.string()
      .label("Item Type")
      .valid("Document", "Parcel", "Edible")
      .required(),
    name: Joi.string().label("Name").required(),
    address: Joi.string().label("Pickup Address").required(),
    description: Joi.string().label("Description").allow("").required(),
    vehicle: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .label("Vehicle")
      .required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
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
        value: Joi.number().max(9999999999).required(),
        countryCode: Joi.string().max(5).required(),
        name: Joi.string().label("Name").required(),
        itemName: Joi.string().label("Item Name").required(),
        address: Joi.string().label("Delivery Address").required(),
        country: Joi.string().label("Country").required(),
        state: Joi.string().label("State").required(),
        quantity: Joi.number().label("Quantity").required(),
      })
      .max(10)
      .required(),
  });

  return Schema.validate(data);
}

function validateCalculateShipment(data) {
  const Schema = Joi.object().keys({
    itemType: Joi.string()
      .label("Item Type")
      .valid("Document", "Parcel", "Edible")
      .required(),
    itemType: Joi.string()
      .label("Item Type")
      .valid("Document", "Parcel", "Edible")
      .required(),
    address: Joi.string().label("Pickup Address").required(),
    vehicle: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .label("Vehicle")
      .required(),
    pickupType: Joi.string()
      .label("Pickup Type")
      .valid("instant", "anytime")
      .required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    delivery: Joi.array()
      .items({
        address: Joi.string().label("Delivery Address").required(),
        country: Joi.string().label("Country").required(),
        state: Joi.string().label("State").required(),
      })
      .required(),
  });

  return Schema.validate(data);
}

function validateSendRiderRequest(data) {
  const Schema = Joi.object().keys({
    entry: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  });

  return Schema.validate(data);
}

function validateEntryID(data) {
  const Schema = Joi.object().keys({
    entry: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
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
  validateSendRiderRequest,
  validateCalculateShipment,
};
