const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
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
    account: {
      type: ObjectId,
      ref: "Account",
      required: true,
      unique: true,
      index: true
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
  },
  {
    timestamps: true,
  }
);

adminSchema.pre(/^find/, function (next) {
  this.populate("account", "-password -rememberToken");
  next();
});
// validate create super
function validateAdminSuper(body) {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    email: Joi.string().max(50).email().required(),
    password: passwordComplexity(complexityOptions).required(),
    confirmPassword: Joi.ref("password"),
    role: Joi.string().required().valid("superAdmin", "admin", "accountant"),
  }).with("password", "confirmPassword");

  return schema.validate(body);
}

// validate create company
function validateAdmin(body) {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    email: Joi.string().max(50).email().required(),
    role: Joi.string().required().valid("superAdmin", "admin", "accountant"),
  });

  return schema.validate(body);
}

function validateAdminLogin(body) {
  const adminSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });

  return adminSchema.validate(body);
}

const Admin = mongoose.model("Admin", adminSchema);

module.exports = {
  Admin,
  validateAdmin,
  validateAdminLogin,
  validateAdminSuper,
};
