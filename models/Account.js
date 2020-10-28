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

const schema = new mongoose.Schema(
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
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    password: {
      type: String,
    },
    type: {
      type: String,
      enum: ["admin", "company", "rider"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
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

// hash passwords for new records before saving
schema.pre("save", async function (next) {
  if (this.isNew) {
    if (!this.password) next();
    this.password = await bcrypt.hash(this.password, 13);
  }
  next();
});

//validate admin's password
schema.methods.isValidPassword = async function (inputedPassword) {
  let validPassword = await bcrypt.compare(inputedPassword, this.password);
  return validPassword;
};

//sign token for this admin
schema.methods.generateToken = function () {
  return JWT.sign(
    {
      id: this._id,
      email: this.email,
      accountType: this.type,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    },
    config.get("application.jwt.key")
  );
};

// validate company verification
function validateVerifyAccount(body) {
  const schema = Joi.object({
    email: Joi.string().email().max(50).required(),
    token: Joi.string().max(50).required(),
    password: passwordComplexity(complexityOptions).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });

  return schema.validate(body);
}

const Account = mongoose.model("Account", schema);

module.exports = { Account, validateVerifyAccount };
