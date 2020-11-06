const mongoose = require("mongoose");
const Joi = require("joi");


const WeightPriceSchema = mongoose.Schema(
  {
    source: {
      type: String,
      index: true,
      required: true,
      default: "admin",
      enum: ["admin", "company"],
    },
    company: {
      type: String,
      ref: "Company",
      default: null,
      index: true,
    },
    organization: {
      type: String,
      ref: "Organization",
      default: null,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0.0,
    },
    unit: {
      type: String,
      default: "kg",
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

function validateWeightPrice(data) {
  const Schema = Joi.object().keys({
    price: Joi.number().label("Distance Per Price").required()
  });

  return Schema.validate(data);
}


const WeightPrice = mongoose.model("WeightPrice", WeightPriceSchema);

module.exports = {
  validateWeightPrice,
  WeightPrice,
};
