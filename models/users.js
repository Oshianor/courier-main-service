const config = require("config");
const { boolean } = require("joi");
const Joi = require("joi");
const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const passwordComplexity = require("joi-password-complexity");
const jwt = require("jsonwebtoken");

const complexityOptions = {
  min: 5,
  max: 20,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 0,
  requirementCount: 2,
};

const UserSchema = new mongoose.Schema(
  {
    parentId: {
      type: ObjectId,
      index: true,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      index: true,
      required: true,
      minlength: 5,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      maxlength: 225,
      index: true,
      required: true,
    },
    firstName: {
      type: String,
      maxlength: 15,
    },
    lastName: {
      type: String,
      maxlength: 15,
    },
  },
  {
    timestamps: true,
  }
);

// generate church token
UserSchema.methods.generateToken = function () {
  const token = jwt.sign(
    {
      id: this._id,
      email: this.email,
    },
    config.get("application.jwt.key"),
    { expiresIn: config.get("application.jwt.expireDate") }
  );
  return token;
};

const User = mongoose.model("User", UserSchema);

function validateUser(user) {
  const Schema = Joi.object().keys({
    email: Joi.string().email().label("Email").max(50).required(),
    firstName: Joi.string().label("First Name").max(15).required(),
    lastName: Joi.string().label("Last Name").max(15).required(),
    phoneNumber: Joi.string().label("Phone Number").min(10).max(11).required(),
    password: passwordComplexity(complexityOptions)
      .label("Password")
      .required(),
    confirmPassword: passwordComplexity(complexityOptions)
      .label("Confirm Password")
      .required(),
  });

  return Schema.validate(user);
}

function validateLogin(user) {
  const Schema = Joi.object().keys({
    email: Joi.string().email().label("Email").max(50).required(),
    password: passwordComplexity(complexityOptions)
      .label("Password")
      .required(),
  });

  return Schema.validate(user);
}

module.exports = {
  validateUser,
  User,
  validateLogin,
};
