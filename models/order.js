const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const orderSchema = mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
      unique: true,
      trim: true,
      lowercase: true,
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
        "pending", // accepted driver/company
        "enrouteToPickup", //on the way to pickup
        "arrivedAtPickup", // arrived at pickup location and awaiting comfirmation
        "pickedup", // When item has been picked
        "enrouteToDelivery", // on the road to delivery.
        "arrivedAtDelivery", // await customer confirmation on delivery
        "delivered", // customer confirmed deluvery
        "cancelled",
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
    itemName: {
      type: String,
      required: true,
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

module.exports = Order;
