const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const CreditHistorySchema = mongoose.Schema(
  {
    txRef: {
      type: String,
      default: null,
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
      default: null,
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
      enum: ["repaid", "loan", "debit"],
      default: "loan",
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
    approvedAt: {
      // this is used to loan request sent to the admin
      type: Date,
      default: null,
    },
    declinedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

const CreditHistory = mongoose.model("CreditHistory", CreditHistorySchema);

module.exports = CreditHistory;