const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const RiderEntryRequestSchema = new mongoose.Schema(
  {
    rider: {
      type: ObjectId,
      ref: "Rider",
      required: true,
      index: true,
    },
    company: {
      type: ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    entry: {
      type: ObjectId,
      ref: "Entry",
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const RiderEntryRequest = mongoose.model(
  "RiderEntryRequest",
  RiderEntryRequestSchema
);

module.exports = RiderEntryRequest;
