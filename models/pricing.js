const mongoose = require("mongoose");


const pricingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 15,
    },
    type: {
      type: String,
      enum: ["premium", "freemium"],
      default: "freemium",
      required: true,
      index: true
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
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["NGN"],
      default: "NGN",
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

const Pricing = mongoose.model("Pricing", pricingSchema);

module.exports = Pricing;
