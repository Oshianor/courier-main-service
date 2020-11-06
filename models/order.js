const mongoose = require("mongoose");
const Joi = require("joi");
const ObjectId = mongoose.Schema.Types.ObjectId;
const {nanoid} = require("nanoid");

const orderSchema = mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
      unique: true,
      // default: nanoid(10)
    },
    entry: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Entry",
    },
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
      required: true,
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
    estimatedCostCurrency: {
      type: String,
      required: true,
      default: "NGN",
    },
    estimatedDistance: {
      type: Number,
      required: true,
    },
    estimatedDistanceUnit: {
      type: String,
      default: "kg",
    },
    // estimatedTime: {
    //   type: Number,
    //   required: true,
    // },
    estimatedTravelduration: {
      type: Number,
      required: true,
    },
    estimatedTraveldurationUnit: {
      type: String,
      default: "min",
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
    deliveryLatitude: {
      type: Number,
      required: true,
      default: 0.0,
    },
    deliveryLongitude: {
      type: Number,
      required: true,
      default: 0.0,
    },
    deliveryAddress: {
      type: String,
      required: true,
      text: true,
    },
    pickupLatitude: {
      type: Number,
      required: true,
      default: 0.0,
    },
    pickupLongitude: {
      type: Number,
      required: true,
      default: 0.0,
    },
    pickupAddress: {
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
    phoneNumber: {
      type: String,
      required: true,
      maxLenght: 10,
    },
    country: {
      type: String,
      required: true,
      index: true,
    },
    countryCode: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      index: true,
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
        default: null,
      },
    ],
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
