const mongoose = require("mongoose");
const Joi = require("joi");
const ObjectId = mongoose.Schema.Types.ObjectId;

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
      type: ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },
    organization: {
      type: ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    weightPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    weightUnit: {
      type: String,
      default: "kg",
    },
    weightCurrency: {
      type: String,
      default: "NGN",
    },
    documentPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    documentCurrency: {
      type: String,
      default: "NGN",
    },
    parcelPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    parcelCurrency: {
      type: String,
      default: "NGN",
    },
    ediblePrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    edibleCurrency: {
      type: String,
      default: "NGN",
    },
    baseFare: {
      type: Number,
      required: true,
      default: 0.0,
    },
    baseFareCurrency: {
      type: String,
      default: "NGN",
    },
    recruitment: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

function validateSettings(data) {
  const Schema = Joi.object().keys({
    weightPrice: Joi.number().label("Weight Price").required(),
    documentPrice: Joi.number().label("Document Price").required(),
    parcelPrice: Joi.number().label("Parcel Price").required(),
    ediblePrice: Joi.number().label("Edible Price").required(),
    baseFare: Joi.number().label("Base Fare").required(),
    recruitment: Joi.boolean().required(),
  });

  return Schema.validate(data);
}


function validateUpdateSettings(data) {
  const Schema = Joi.object().keys({
    weightPrice: Joi.number().label("Weight Price").optional(),
    documentPrice: Joi.number().label("Document Price").optional(),
    parcelPrice: Joi.number().label("Parcel Price").optional(),
    ediblePrice: Joi.number().label("Edible Price").optional(),
    baseFare: Joi.number().label("Base Fare").optional(),
    recruitment: Joi.boolean().optional(),
  });

  return Schema.validate(data);
}


const Setting = mongoose.model("Setting", SettingSchema);

module.exports = {
  validateSettings,
  validateUpdateSettings,
  Setting,
};
