const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const riderBankSchema = new mongoose.Schema(
  {
    rider: {
      type: ObjectId,
      ref: "Rider",
      required: true
    },
    accountNumber: {
      type: String,
      required: true
    },
    accountName: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    bankCode: {
      type: String,
    },
    default: {
      type: Boolean,
      default: false,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

const RiderBank = mongoose.model("RiderBank", riderBankSchema);

module.exports = RiderBank;