const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const paymentHistorySchema = new mongoose.Schema(
  {
    company: {
      type: ObjectId,
      index: true,
      ref: "Company",
      required: true,
    },
    amount: {
      type: Number,
      required: true
    },
    transactionRef: {
      type: String,
      index: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["successful", "failed"],
      required: true,
    },
    service: {
      type: String,
      enum: ["subscription"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Card", "Bank"],
      default: "Card",
    }
  },
  {
    timestamps: true,
  }
);

const paymentHistory = mongoose.model("paymentHistory", paymentHistorySchema);

module.exports = paymentHistory;