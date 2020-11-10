const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const Jwt = require("jsonwebtoken");
const config = require("config");
const Joi = require("joi");


const transactionSchema = new mongoose.Schema(
  {
    txRef: {
      type: String,
      default: null,
    },
    entry: {
      type: ObjectId,
      index: true,
      required: true,
    },
    user: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    card: {
      type: ObjectId,
      default: null,
    },
    rider: {
      type: ObjectId,
      index: true,
      ref: "Rider",
      default: null,
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "card",
      enum: ["card", "cash"],
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    approvedAt: {
      // this is for the rider
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: ""
    },
  },
  {
    timestamps: true,
  }
);


function validateTransaction(body) {
  const schema = Joi.object({
    paymentMethod: Joi.string().valid("cash", "card").required(),
    entry: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    card: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .when("paymentMethod", {
        is: "card",
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
  });

  return schema.validate(body);
}

function validateTransactionStatus(body) {
  const schema = Joi.object({
    status: Joi.string().valid("approved", "declined").required(),
  });

  return schema.validate(body);
}

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = {
  Transaction,
  validateTransaction,
  validateTransactionStatus,
};
