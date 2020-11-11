const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const Jwt = require("jsonwebtoken");
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

const companySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["HQ", "BR"],
      default: "HQ",
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
    address: String,
    vehicles: {
      type: [ObjectId],
      ref: "Vehicle",
      required: true,
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
      index: true,
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
    },
    config.get("application.jwt.key"),
    { expiresIn: "1w" }
  );
};

// validate create company
function validateCompany(body) {
  const schema = Joi.object({
    name: Joi.string().label("Company Name").required(),
    email: Joi.string().email().label("Email Address").max(50).required(),
    address: Joi.string().label("Address").max(225).required(),
    phoneNumber: Joi.string().label("Phone Number").min(10).max(10).required(),
    contactName: Joi.string().label("Contact Name").max(30).required(),
    contactPhoneNumber: Joi.string()
      .label("Contact Phone Number")
      .min(10)
      .max(10)
      .required(),
    RCNumber: Joi.string().label("RC Number").required(),
    TIN: Joi.string().label("T.I.N").required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    tier: Joi.string().label("Pricing Plan").required(),
    vehicles: Joi.array()
      .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/).required())
      .required(),
    password: passwordComplexity(complexityOptions)
      .label("Password")
      .required(),
    confirmPassword: passwordComplexity(complexityOptions)
      .label("Confirm Password")
      .valid(Joi.ref("password"))
      .required(),
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
    name: Joi.string().label("Company Name").max(50).optional(),
    email: Joi.string().email().label("Email Address").max(50).optional(),
    address: Joi.string().label("Address").max(225).optional(),
    contactName: Joi.string().label("Contact Name").max(30).optional(),
    contactPhoneNumber: Joi.string()
      .label("Contact Phone Number")
      .min(10)
      .max(10)
      .optional(),
    phoneNumber: Joi.string().label("Phone Number").min(10).max(10).optional(),
    RCNumber: Joi.string().label("RC Number").optional(),
    TIN: Joi.string().label("T.I.N").optional(),
    country: Joi.string().label("Country").optional(),
    state: Joi.string().label("State").optional(),
  });
  return schema.validate(body);
}

function validateStatusUpdate(body) {
  const schema = Joi.object({
    status: Joi.string().required().valid("active", "inactive", "suspended"),
  });

  return schema.validate(body);
}


// validate company verification
function validateVerifyCompany(body) {
  const schema = Joi.object({
    email: Joi.string().email().max(50).required(),
    token: Joi.string().max(225).required()
  });

  return schema.validate(body);
}


// validate company verification
function validateCompanyVerification(body) {
  const schema = Joi.object({
    status: Joi.string().valid("approve", "decline").max(50).required(),
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
  validateVerifyCompany,
  validateCompanyVerification,
};
