const mongoose = require("mongoose");
const Joi = require("joi");

const WeightSchema = mongoose.Schema(
  {
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
const DocumentItemSchema = mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
      default: 0.0,
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


const SettingSchema = mongoose.Schema(
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
    weight: WeightSchema,
    document: DocumentItemSchema,
    parcel: DocumentItemSchema,
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


const Setting = mongoose.model("Setting", SettingSchema);

module.exports = {
  validateWeightPrice,
  Setting,
};
