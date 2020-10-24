const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const riderSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastname: {
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Rider", companySchema);
