const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const WalletHistorySchema = mongoose.Schema(
  {
    txRef: {
      type: String,
      default: null,
    },
    enterprise: {
      type: ObjectId,
      index: true,
      required: true,
      ref: "Enterprise",
    },
    type: {
      type: String,
      enum: ["dr", "cr"],
      default: "cr",
    },
    user: {
      type: ObjectId,
      index: true,
      required: true,
      ref: "User",
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
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const WalletHistory = mongoose.model("WalletHistory", WalletHistorySchema);

module.exports = WalletHistory;
