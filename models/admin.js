const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Jwt = require("jsonwebtoken");
const Joi = require("joi");
const config = require("config");
const ObjectId = mongoose.Schema.Types.ObjectId;
const passwordComplexity = require("joi-password-complexity");

const complexityOptions = {
  min: 6,
  max: 20,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 2,
};

const adminSchema = new mongoose.Schema(
  {
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
      required: true,
      maxlength: 10,
    },
    password: {
      type: String,
      maxlength: 225,
    },
    country: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    address: {
      type: String,
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
    role: {
      type: String,
      required: true,
      enum: ["superAdmin", "admin", "accountant"],
    },
    createdBy: {
      type: ObjectId,
      ref: "Admin",
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
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

//sign token for this admin
adminSchema.methods.generateToken = function () {
  return Jwt.sign(
    {
      id: this._id,
      email: this.email,
      type: "admin",
    },
    config.get("application.jwt.key"),
    { expiresIn: "3d" }
  );
};


const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
