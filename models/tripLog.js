const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId


const tripLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "driverAccepted",
        "enrouteToPickup",
        "pickedup",
        "enrouteToDelivery",
        "arrivedAtPickup",
        "arrivedAtDelivery",
        "delivered",
        "completed",
        "confirmPayment",
        "cancelled",
      ],
      required: true,
      index: true,
    },
    rider: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Rider",
    },
    user: {
      type: ObjectId,
      required: true,
      index: true,
      // ref: "User",
    },
    entry: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Entry",
    },
    order: {
      type: ObjectId,
      index: true,
      ref: "Order",
      default: null,
    },
    latitude: {
      type: Number,
      default: 0.0,
    },
    longitude: {
      type: Number,
      default: 0.0,
    },
    metaData: {
      type: Object,
      default: {},
    },
    address: {
      type: String,
      required: true
    },
  },
  {
    timestamps: true,
  }
);

const TripLog = mongoose.model("TripLog", tripLogSchema);

module.exports = TripLog;
