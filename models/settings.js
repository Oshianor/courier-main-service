const mongoose = require("mongoose");
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

const Setting = mongoose.model("Setting", SettingSchema);

module.exports = Setting;
