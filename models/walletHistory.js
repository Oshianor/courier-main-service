const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const WalletHistorySchema = mongoose.Schema(
  {
    txRef: {
      type: String,
      default: null,
    },
    wallet: {
      type: ObjectId,
      index: true,
      required: true,
      ref: "Wallet",
    },
    source: {
      type: String,
      index: true,
      required: true,
      enum: ["enterprise", "admin"],
      default: "enterprise",
    },
    enterprise: {
      type: ObjectId,
      index: true,
      required: true,
      ref: "Enterprise",
    },
    admin: {
      type: ObjectId,
      ref: "Admin",
    },
    entry: {
      type: ObjectId,
      ref: "Entry",
    },
    shipment: {
      type: ObjectId,
      ref: "Shipment",
      default: null
    },
    type: {
      type: String,
      enum: ["debit", "credit"],
      default: "credit",
    },
    user: {
      type: ObjectId,
      index: true,
      required: true,
      // ref: "User",
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


// origins [ 'Km 19 Lekki - Epe Expy, Lekki Penninsula II, Lekki, Nigeria' ]
// destinations [
//   'Oba Ogunji Rd, Ijaiye, Lagos, Nigeria',
//   'Lekki - Epe Expy, Aja, Lagos, Nigeria'
// ]
