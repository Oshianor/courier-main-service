const mongoose = require("mongoose");
const Joi = require("joi");
const ObjectId = mongoose.Schema.Types.ObjectId;
const nanoid = require("nanoid")


const orderSchema = mongoose.Schema(
  {
    orderId: {
      type: Number,
      required: true,
      index: true,
      unique: true
    },
    entry: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Entry",
    },
    items: [{ type: ObjectId, ref: "Order", required: true }],
    company: {
      type: ObjectId,
      index: true,
      ref: "Company",
      default: null,
    },
    user: {
      type: ObjectId,
      index: true,
      ref: "User",
      default: null,
    },
    rider: {
      type: ObjectId,
      index: true,
      ref: "Rider",
      default: null,
    },
    estimatedCost: {
      type: Number,
      required: true,
    },
    estimatedDistance: {
      type: Number,
      required: true,
    },
    estimatedTime: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "awaitingPickupConfirmation",
        "pickup",
        "awaitingDeliveryConfirmation",
        "delivered",
      ],
      default: "pending",
    },
    tollFee: {
      type: Number,
      default: 0.0,
    },
    latitude: {
      type: Number,
      required: true,
      default: 0.0,
    },
    longitude: {
      type: Number,
      required: true,
      default: 0.0,
    },
    address: {
      type: String,
      required: true,
      text: true,
    },
    metaData: {
      type: Object,
      default: {},
    },
    email: {
      type: String,
      required: true,
      index: true,
      maxLenght: 50,
    },
    name: {
      type: String,
      required: true,
      maxLenght: 30,
    },
    deliveryTime: {
      type: Date,
      required: true,
    },
    itemName: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);




const Order = mongoose.model("Order", orderSchema);

module.exports = {
  Order,
};
