const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    contactName: {
      type: String,
    },
    contactPhoneNumber: {
      type: String,
    },
    RCnumber: String,
    TIN: String,
    Status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
    },
    totalRiders: {
      type: Number,
    },
    totalTransaction: {
      type: Number,
    },
    totalOrders: {
      type: Number,
    },
    vehicles: {
      type: mongoose.Types.ObjectId,
      ref: "Vehicle",
    },
    rcDoc: {
      type: String,
    },
    priority: {
      type: Number,
      default: 0,
    },
    logo: {
      type: String,
    },
    tier: {
      type: String,
      enum: ["basic", "premium"],
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

// hash passwords for new records before saving
companySchema.pre("save", async function (next) {
  if (this.isNew) {
    this.password = await bcrypt.hash(this.password, 13);
  }
  next();
});

//validate company's password
companySchema.methods.isValidPassword = async function (inputedPassword) {
  let validPassword = await bcrypt.compare(inputedPassword, this.password);
  return validPassword;
};

module.exports = mongoose.model("Company", companySchema);
