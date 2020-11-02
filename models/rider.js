const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const Jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("config");
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
      maxlength: 11,
    },
    password: {
      type: String,
      maxlength: 225,
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
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "inactive",
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
      required: true,
    },
    phoneNumberVerified: {
      type: Boolean,
      default: false,
      index: true,
      required: true,
    },
    company: {
      type: ObjectId,
      ref: "Company",
      required: true,
    },
    companyRequest: {
      type: String,
      required: true,
      enum: ["pending", "declined", "approved"],
      default: "approved",
      index: true,
    },
    vehicle: {
      type: ObjectId,
      ref: "Vehicle",
      required: true,
    },
    createdBy: {
      type: String,
      default: "company",
      enum: ["company", "self"],
    },
    verificationType: {
      type: String,
      required: true,
      default: "email",
      enum: ["email", "otp"],
    },
    onlineStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    tripStatus: {
      type: Boolean,
      default: false,
      // enum: ["ongoing", ""]
      index: true,
    },
    policyNumber: {
      type: String,
    },
    DOB: Date,
    POI: String,
    POIExpiringDate: Date,
    img: String,
    plateNumber: String,
    ECName: String, //emergency contact name
    ECPhone: String,
    ECEmail: String,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
      // required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: ObjectId,
      ref: "Admin",
      default: null,
    },
    OTPCode: {
      type: String,
      maxlength: 4,
      default: null,
    },
    OTPExpiredDate: { type: Date, default: null },
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

riderSchema.methods.generateToken = function () {
  return Jwt.sign(
    {
      id: this._id,
      email: this.email,
      companyId: this.company,
      type: "rider",
    },
    config.get("application.jwt.key"),
    { expiresIn: "16w" }
  );
};

function validateRider(body) {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    email: Joi.string().email().max(50).optional(),
    phoneNumber: Joi.string().max(10).required(),
    address: Joi.string().max(225).required(),
    DOB: Joi.date().required(),
    POIExpiringDate: Joi.date().required(),
    policyNumber: Joi.string().required(),
    plateNumber: Joi.string().max(15).required(),
    vehicle: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    ECName: Joi.string().max(30).required(),
    ECPhone: Joi.string().max(10).required(),
    ECEmail: Joi.string().email().max(50).required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
  });

  return schema.validate(body);
}

function validateRiderSelf(body) {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    email: Joi.string().email().max(50).optional(),
    phoneNumber: Joi.string().max(10).required(),
    address: Joi.string().max(225).required(),
    DOB: Joi.date().required(),
    POIExpiringDate: Joi.date().required(),
    policyNumber: Joi.string().required(),
    plateNumber: Joi.string().max(15).required(),
    vehicle: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    company: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    ECName: Joi.string().max(30).required(),
    ECPhone: Joi.string().max(10).required(),
    ECEmail: Joi.string().email().max(50).required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    password: passwordComplexity(complexityOptions).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });

  return schema.validate(body);
}

function validateUpdateRider(body) {
  const schema = Joi.object({
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

  return schema.validate(body);
}

function validateRiderLogin(body) {
  const adminSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });

  return adminSchema.validate(body);
}

const Rider = mongoose.model("Rider", riderSchema);

module.exports = {
  Rider,
  validateRider,
  validateUpdateRider,
  validateRiderSelf,
  validateRiderLogin,
};
