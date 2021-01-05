const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const CreditHistorySchema = mongoose.Schema(
  {
    txRef: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["dr", "cr"],
      required: true,
      default: "cr",
    },
    enterprise: {
      type: ObjectId,
      index: true,
      required: true,
      ref: "Enterprise",
    },
    amount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    createdBy: {
      type: ObjectId,
      ref: "Admin",
      required: true,
    },
    approvedAt: {
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

const CreditHistory = mongoose.model("CreditHistory", CreditHistorySchema);

module.exports = CreditHistory;
