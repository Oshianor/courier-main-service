const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const transactionSchema = new mongoose.Schema(
  {
    txRef: {
      type: String,
      default: null,
    },
    entry: {
      type: ObjectId,
      index: true,
      required: true,
      ref: "Entry",
    },
    user: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    card: {
      type: ObjectId,
      default: null,
    },
    rider: {
      type: ObjectId,
      index: true,
      ref: "Rider",
      default: null,
    },
    company: {
      type: ObjectId,
      index: true,
      ref: "Company",
      default: null,
    },
    enterprise: {
      type: ObjectId,
      index: true,
      ref: "Enterprise",
      default: null,
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "card",
      enum: ["card", "cash", "wallet", "credit"],
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    approvedAt: {
      // this is for the rider when the payment method is cash
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
