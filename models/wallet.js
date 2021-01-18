const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const WalletSchema = mongoose.Schema(
  {
    source: {
      type: String,
      index: true,
      required: true,
      enum: ["enterprise"],
      default: "enterprise",
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "suspended"]
    },
    enterprise: {
      type: ObjectId,
      ref: "Enterprise",
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalSpent: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalDeposited: {
      type: Number,
      required: true,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model("Wallet", WalletSchema);

module.exports = Wallet;
