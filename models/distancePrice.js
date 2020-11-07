const mongoose = require("mongoose");
const Joi = require("joi");
const ObjectId = mongoose.Schema.Types.ObjectId;


const DistancePriceSchema = mongoose.Schema(
  {
    source: {
      type: String,
      index: true,
      required: true,
      default: "admin",
      enum: ["admin", "company"],
    },
    company: {
      type: ObjectId,
      ref: "Company",
      index: true,
    },
    organization: {
      type: ObjectId,
      ref: "Organization",
      index: true,
    },
    country: {
      type: String,
      index: true,
      required: true,
    },
    state: {
      type: String,
      index: true,
      required: true,
      unique: true,
    },
    vehicle: {
      type: ObjectId,
      index: true,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0.0,
    },
    unit: {
      type: String,
      default: "km",
    },
    currency: {
      type: String,
      default: "NGN",
    },
  },
  {
    timestamps: true,
  }
);

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

const DistancePrice = mongoose.model("DistancePrice", DistancePriceSchema);

module.exports = {  
  validateDistancePrice,
  validateUpdateDistancePrice,
  validateDistancePriceCompany,
  DistancePrice,
};
