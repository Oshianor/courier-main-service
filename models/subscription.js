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
    status: {
      type: String,
      enum: ["running", "expired", "ontrial"],
      default: "running",
    },
    duration: {
      type: Number
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    nextPaidPlan: {
      type: ObjectId,
      ref: "Pricing"
    },
    nextRetry: {
      type: Date,
    },
    retryCount: {
      type: Number
    },
    trialDays: {
      type: Number
    }
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;