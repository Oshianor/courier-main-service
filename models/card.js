const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;


const CardSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    company: {
      type: ObjectId,
      index: true,
      ref: "Company",
    },
    txRef: {
      type: String,
      index: true,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    accountName: {
      type: String,
      default: "",
    },
    bank: { type: String, required: true },
    expMonth: { type: String, required: true },
    expYear: { type: String, required: true },
    last4: { type: String, required: true, index: true },
    bin: { type: String, required: true },
    source: { type: String, default: "paystack", enum: ["paystack"] },
    default: { type: Boolean, required: true, default: false },
    email: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Card = mongoose.model("Card", CardSchema);

module.exports = Card;