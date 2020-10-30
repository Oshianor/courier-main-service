const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");
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

const riderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    account: {
      type: mongoose.Types.ObjectId,
      ref: "Account",
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
      //emergency contact name
      type: String,
    },
    ecPhone: {
      type: String,
    },
    ecEmail: {
      type: String,
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

riderSchema.pre(/^find/, function (next) {
  this.populate("account", "-password");
  next();
});

function validateRider(body) {
  const riderSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().required(),
    address: Joi.string().required(),
    DOB: Joi.date().required(),
    proofOfIdentityExpireAt: Joi.date().optional(),
    policyNumber: Joi.string().optional(),
    plateNumber: Joi.string().optional(),
    ecName: Joi.string().optional(),
    ecPhone: Joi.string().optional(),
    ecEmail: Joi.string().email().optional(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    platform: Joi.string().label("Platform").required(),
  });

  return riderSchema.validate(body);
}

function validateRiderSelf(body) {
  const riderSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().required(),
    password: passwordComplexity(complexityOptions).required(),
    confirmPassword: Joi.ref("password"),
    address: Joi.string().required(),
    DOB: Joi.date().required(),
    proofOfIdentityExpireAt: Joi.date().optional(),
    policyNumber: Joi.string().optional(),
    plateNumber: Joi.string().optional(),
    ecName: Joi.string().optional(),
    ecPhone: Joi.string().optional(),
    ecEmail: Joi.string().email().optional(),
  }).with("password", "confirmPassword");

  return riderSchema.validate(body);
}

function validateUpdateRider(body) {
  const riderSchema = Joi.object({
    name: Joi.string().optional(),
    address: Joi.string().optional(),
    DOB: Joi.date().optional(),
    proofOfIdentityExpireAt: Joi.date().optional(),
    policyNumber: Joi.string().optional(),
    plateNumber: Joi.string().optional(),
    ecName: Joi.string().optional(),
    ecPhone: Joi.string().optional(),
    ecEmail: Joi.string().email().optional(),
  });

  return riderSchema.validate(body);
}

const Rider = mongoose.model("Rider", riderSchema);

module.exports = {
  Rider,
  validateRider,
  validateUpdateRider,
  validateRiderSelf,
};
