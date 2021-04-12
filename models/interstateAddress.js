const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const InterStateAddressSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: false,
      index: true,
      maxLenght: 50,
    },
    name: {
      type: String,
      required: true,
      maxLenght: 30,
    },
    country: {
      type: String,
      required: true,
      index: true,
    },
    countryCode: {
      type: String,
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      maxLenght: 10,
    },
    state: {
      type: String,
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
      default: 0.0,
    },
    lng: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

const InterstateAddress = mongoose.model("InterStateAddress",InterStateAddressSchema);

module.exports = InterstateAddress;

