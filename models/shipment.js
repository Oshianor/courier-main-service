const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const ShipmentSchema = new mongoose.Schema(
  {
    entries: [{
      type: ObjectId,
      ref: "Entry",
    }],
    orders: [{
      type: ObjectId,
      ref: "Order",
    }],
    transactions: [{
      type: ObjectId,
      ref: "Transaction",
    }],
    TEC: {
      type: Number,
      required: true,
    },
    TED: {
      type: Number,
      required: true,
    },
    TET: {
      type: Number,
      required: true,
    },
    parentEntry: {
      type: ObjectId,
      required: false,
      ref: "Entry",
      default: null
    },
    enterprise: {
      type: ObjectId,
      default: null,
      ref: "Enterprise",
    },
    user: {
      type: ObjectId,
      required: true,
      index: true,
    },
    company: {
      type: ObjectId,
      ref: "Company",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Shipment = mongoose.model("Shipment", ShipmentSchema);

module.exports = Shipment;