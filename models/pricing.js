const mongoose = require("mongoose");
const Joi = require("joi");


const pricingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 15,
    },
    priority: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
      required: true,
      index: true,
    },
    transactionCost: {
      type: Number,
      required: true,
    },
    format: {
      type: String,
      enum: ["percentage"],
      default: "percentage",
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      enum: ["naira"],
      default: "naira",
    },
    symbol: {
      type: String,
      default: "₦",
    },
    features: [
      {
        type: String,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);


function validatePricing(data) {
  const Schema = Joi.object().keys({
    name: Joi.string().max(30).label("Plan name").required(),
    features: Joi.array().min(0).label("Plan features").required(),
    priority: Joi.number().min(0).label("Priority").required(),
    transactionCost: Joi.number().min(0).label("Transaction Cost").required(),
    price: Joi.number().min(0).label("Price").required(),
    currency: Joi.string().min(0).label("Format").required(),
    symbol: Joi.string().min(0).label("Symbol").required(),
  });

  return Schema.validate(data);
}

const Pricing = mongoose.model("pricings", pricingSchema);

module.exports = {
  Pricing,
  validatePricing,
};
