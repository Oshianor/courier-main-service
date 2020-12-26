const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const subscriptionSchema = new mongoose.Schema(
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
    // Up for review
    duration: {
      type: Number
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;