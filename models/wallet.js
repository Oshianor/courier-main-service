const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const SettingSchema = mongoose.Schema(
  {
    source: {
      type: String,
      index: true,
      required: true,
      enum: ["enterprise"],
      default: "enterprise",
    },
    enterprise: {
      type: ObjectId,
      ref: "Enterprise",
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalSpent: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalDeposited: {
      type: Number,
      required: true,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model("Setting", SettingSchema);

module.exports = Setting;
