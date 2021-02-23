const mongoose = require("mongoose");
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
    },
    vehicle: {
      type: ObjectId,
      index: true,
      required: true,
      ref: "Vehicle",
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

const DistancePrice = mongoose.model("DistancePrice", DistancePriceSchema);

module.exports = DistancePrice;
