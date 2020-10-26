const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const riderSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
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
      //proof of Identiry
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
      type: String,
    },
    ecPhone: {
      type: String,
    },
    ecEmail: {
      type: String,
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

function validateRider(body) {
  const riderSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
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
  });

  return riderSchema.validate(body);
}

function validateUpdateRider(body) {
  const riderSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    address: Joi.string().required(),
    DOB: Joi.date().required(),
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

mongoose.exports = {
  Rider,
  validateRider,
  validateUpdateRider,
};
