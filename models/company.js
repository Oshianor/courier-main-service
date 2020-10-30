const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const JWT = require("jsonwebtoken");
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
  requirementCount: 1,
};

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    account: {
      type: ObjectId,
      ref: "Account",
      required: true,
      unique: true,
      index: true,
    },
    publicToken: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    contactName: {
      type: String,
      required: true,
      maxlength: 30,
    },
    contactPhoneNumber: {
      type: String,
      required: true,
      maxlength: 11,
    },
    RCNumber: { type: String, required: true },
    TIN: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "inactive",
      required: true,
    },
    vehicles: {
      type: [ObjectId],
      ref: "Vehicle",
      // required: true,
    },
    rcDoc: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    tier: {
      type: ObjectId,
      ref: "Pricing",
      required: true,
    },
    createdBy: {
      type: ObjectId,
      ref: "Admin",
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: mongoose.Types.ObjectId,
      ref: "Account",
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

companySchema.pre(/^find/, function (next) {
  this.populate("account", "-password");
  next();
});

// validate create company
function validateCompany(body) {
  const schema = Joi.object({
    name: Joi.string().label("Company Name").required(),
    email: Joi.string().email().label("Email Address").max(50).required(),
    address: Joi.string().label("Address").max(225).required(),
    contactName: Joi.string().label("Contact Name").max(30).required(),
    contactPhoneNumber: Joi.string()
      .label("Contact Phone Number")
      .max(11)
      .required(),
    RCNumber: Joi.string().label("RC Number").required(),
    TIN: Joi.string().label("T.I.N").required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    platform: Joi.string().label("Platform").required(),
  });

  return schema.validate(body);
}

// validate login as company
function validateCompanyLogin(body) {
  const schema = Joi.object({
    email: Joi.string().email().max(50).required(),
    password: passwordComplexity(complexityOptions).required(),
  });

  return schema.validate(body);
}

function validateUpdateCompany(body) {
  const schema = Joi.object({
    name: Joi.string().label("Company Name").required(),
    email: Joi.string().email().label("Email Address").max(50).required(),
    address: Joi.string().label("Address").max(225).required(),
    contactName: Joi.string().label("Contact Name").max(30).required(),
    contactPhoneNumber: Joi.string()
      .label("Contact Phone Number")
      .max(11)
      .required(),
    RCNumber: Joi.string().label("RC Number").required(),
    TIN: Joi.string().label("T.I.N").required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
  });
  return schema.validate(body);
}

function validateStatusUpdate(body) {
  const schema = Joi.object({
    status: Joi.string().required().valid("active", "inactive", "suspended"),
  });

  return schema.validate(body);
}

const Company = mongoose.model("Company", companySchema);

module.exports = {
  Company,
  validateCompany,
  validateCompanyLogin,
  validateUpdateCompany,
  validateStatusUpdate,
};
