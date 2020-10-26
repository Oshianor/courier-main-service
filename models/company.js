const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const ObjectId = mongoose.Schema.Types.ObjectId;
const passwordComplexity = require("joi-password-complexity");

const complexityOptions = {
  min: 6,
  max: 20,
  lowerCase: 1,
  upperCase: 0,
  numeric: 1,
  symbol: 0,
  requirementCount: 1,
};

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      maxlength: 70
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
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
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
      type: [ObjectId],
      ref: "Vehicle",
    },
    rcDoc: {
      type: String,
    },
    publicToken: {
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

// validate create company
function validateCompany(body) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email(),
    contactName: Joi.string().required(),
    contactPhoneNumber: Joi.string().required(),
    RCnumber: Joi.string().required(),
    TIN: Joi.string().required(),
  });

  return schema.validate(body);
}

// validate login as company
function validateCompanyLogin(body) {
  const schema = Joi.object({
    email: Joi.string().email(),
    password: Joi.ref("password"),
  });

  return schema.validate(body);
}

const Company = mongoose.model("Company", companySchema);


module.exports = {
  Company,
  validateCompany,
};
