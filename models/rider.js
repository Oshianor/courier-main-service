const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const riderSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    policyNumber: {
      type: String,
    },
    uuid: {
      type: String,
    },
    DOB: {
      type: Date,
    },
    proofOfIdentity: {
      //proof of Identiry
      type: String,
    },
    proofOfIdentityExpireAt: {
      type: Date,
    },
    image: {
      type: String,
    },
    company: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
    },
    onlineStatus: {
      type: Boolean,
      default: false,
    },
    vehicle: {
      type: mongoose.Types.ObjectId,
      ref: "Vehicle",
    },
    plateNumber: {
      type: String,
    },
    ecName: {
      type: String,
    },
    ecPhone: {
      type: String,
    },
    ecEmail: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumberVerified: {
      type: Boolean,
      default: false,
    },
    rememberToken: {
      token: {
        type: String,
        default: null,
      },
      expiredDate: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Rider", riderSchema);
