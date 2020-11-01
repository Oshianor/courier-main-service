const mongoose = require("mongoose");
const Joi = require("joi");
const ObjectId = mongoose.Schema.Types.ObjectId;


const orderSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    order: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Order",
    },
    img: [
      {
        type: String,
        ref: "User",
        default: null,
      },
    ],
    description: {
      type: String,
      default: "",
      required: true,
      maxLenght: 3000,
    },
    weight: {
      type: Number,
      required: true,
      default: 0.0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0.0,
    },
    metaData: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);




const Order = mongoose.model("Order", orderSchema);

module.exports = {
  Order,
};
