const mongoose = require("mongoose");
const Jwt = require("jsonwebtoken");
const config = require("config");
const ObjectId = mongoose.Schema.Types.ObjectId;

// git add .;git commit -m "updated company account creating";git checkout dev;git merge abundance;git push;git checkout abundance;
const companySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["HQ", "BR"],
      default: "HQ",
    },
    ownership: {
      type: Boolean,
      default: false,
      index: true,
    },
    organization: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Organization",
    },
    name: {
      type: String,
      maxlength: 30,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      unique: true,
      index: true,
      maxlength: 10,
    },
    password: {
      type: String,
      maxlength: 225,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "inactive",
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: ObjectId,
      ref: "Admin",
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    phoneNumberVerified: {
      type: Boolean,
      default: false,
      index: true,
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
    description: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    postcode: {
      type: String,
      required: true,
      maxlength: 10,
    },
    contactName: {
      type: String,
      required: true,
      maxlength: 30,
    },
    contactEmail: {
      type: String,
      required: true,
      maxlength: 50,
    },
    contactPhoneNumber: {
      type: String,
      required: true,
      maxlength: 11,
    },
    RCNumber: { type: String, required: true },
    TIN: { type: String, required: true },
    address: String,
    vehicles: {
      type: [ObjectId],
      ref: "Vehicle",
      required: true,
    },
    cac: {
      type: String,
      required: true,
    },
    tier: {
      type: ObjectId,
      ref: "Pricing",
      index: true,
      required: true,
    },
    poi: {
      type: String,
      required: true,
    },
    poa: {
      type: String,
      required: true,
    },
    insuranceCert: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    totalRiders: {
      type: Number,
      default: 0,
    },
    totalTransaction: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: ObjectId,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

companySchema.methods.generateToken = function () {
  return Jwt.sign(
    {
      id: this._id,
      email: this.email,
      type: "company",
      state: this.state,
    },
    config.get("application.jwt.key"),
    { expiresIn: "1w" }
  );
};


const Company = mongoose.model("Company", companySchema);

module.exports = Company;
