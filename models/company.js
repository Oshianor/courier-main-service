const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");
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
    publicToken: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      maxlength: 50,
      index: true,
    },
    password: {
      type: String,
    },
    address: {
      type: String,
      required: true,
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
    createdBy: {
      type: ObjectId,
      ref: "Admin",
    },
    rememberToken: {
      token: {
        type: String,
        default: null,
        maxlength: 50
      },
      expiredDate: {
        type: Date,
        default: null,
      },
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
  },
  {
    timestamps: true,
  }
);


//validate company's password
companySchema.methods.isValidPassword = async function (inputedPassword) {
  let validPassword = await bcrypt.compare(inputedPassword, this.password);
  return validPassword;
};

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

// validate company verification
function validateVerifyCompany(body) {
  const schema = Joi.object({
    email: Joi.string().email().max(50).required(),
    token: Joi.string().max(50).required(),
    password: passwordComplexity(complexityOptions).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });

  return schema.validate(body);
}

const Company = mongoose.model("Company", companySchema);


module.exports = {
  Company,
  validateCompany,
  validateCompanyLogin,
  validateVerifyCompany,
};
