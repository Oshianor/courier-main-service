const mongoose = require("mongoose");
const Joi = require("joi");


const DistancePriceSchema = mongoose.Schema(
  {
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
    price: Joi.number().label("Distance Per Price").required()
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
  DistancePrice,
};
