const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const subscriptionHistorySchema = new mongoose.Schema(
  {
    company: {
      type: ObjectId,
      index: true,
      ref: "Company",
      required: true,
    },
    pricing: {
      type: ObjectId,
      index: true,
      ref: "Pricing",
      required: true,
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    duration: {
      type: Number
    },
  },
  {
    timestamps: true,
  }
);

const subscriptionHistory = mongoose.model("subscriptionHistory", subscriptionHistorySchema);

module.exports = subscriptionHistory;