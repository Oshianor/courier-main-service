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
    name: {
      type: String,
      maxlength: 30,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["superAdmin", "admin", "accountant"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    createdBy: {
      type: ObjectId,
      ref: "Admin",
      default: null,
      required: true,
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
adminSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.password = await bcrypt.hash(this.password, 13);
  }
  next();
});

//validate admin's password
adminSchema.methods.isValidPassword = async function (inputedPassword) {
  let validPassword = await bcrypt.compare(inputedPassword, this.password);
  return validPassword;
};

//sign token for this admin
adminSchema.methods.generateToken = function () {
  return JWT.sign(
    {
      id: this._id,
      email: this.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    },
    config.get("application.jwt.key")
  );
};

// validate create company
function validateAdmin(body) {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    email: Joi.string().max(50).email().required(),
    password: passwordComplexity(complexityOptions).required(),
    confirmPassword: Joi.string().disallow(Joi.ref("password")).required(),
    role: Joi.string().required().valid("superAdmin", "admin", "accountant"),
  });

  return schema.validate(body);
}

const Admin = mongoose.model("Admin", adminSchema);

module.exports = {
  Admin,
  validateAdmin,
};