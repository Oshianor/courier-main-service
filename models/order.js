const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const OTPRecordSchema = mongoose.Schema(
  {
    OTPCode: {
      type: String,
      default: null,
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

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
    status: {
      type: String,
      enum: [
        "request",
        "pending", // accepted driver/company
        "enrouteToPickup", //on the way to pickup
        "arrivedAtPickup", // arrived at pickup location and awaiting comfirmation
        "pickedup", // When item has been picked
        "enrouteToDelivery", // on the road to delivery.
        "arrivedAtDelivery", // await customer confirmation on delivery
        "delivered", // customer confirmed deluvery
        "cancelled", // company declined an order
      ],
      default: "request",
    },
    entry: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Entry",
    },
    enterprise: {
      type: ObjectId,
      index: true,
      default: null,
      ref: "Enterprise",
    },
    company: {
      type: ObjectId,
      index: true,
      ref: "Company",
      default: null,
    },
    transaction: {
      type: ObjectId,
      index: true,
      ref: "Transaction",
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
    vehicle: {
      type: ObjectId,
      index: true,
      required: true,
      ref: "Vehicle",
    },
    pickupType: {
      type: String,
      default: "anytime",
      enum: ["instant", "anytime"],
    },
    instantPricing: {
      type: Number,
      default: 1.5,
    },
    value: {
      type: Number,
      required: true,
      default: 0,
    },
    OTPCode: {
      type: String,
      default: null,
      trim: true,
    },
    OTPRecord: [OTPRecordSchema],
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
      default: "km",
    },
    estimatedTravelduration: {
      type: Number,
      required: true,
    },
    estimatedTraveldurationUnit: {
      type: String,
      default: "min",
    },
    tollFee: {
      type: Number,
      default: 0.0,
    },
    deliveryAddress: {
      type: String,
      required: true,
      text: true,
    },
    pickupAddress: {
      type: String,
      required: true,
      text: true,
    },
    pickupLatitude: {
      type: Number,
      default: 0.0,
      required: true,
    },
    pickupLongitude: {
      type: Number,
      default: 0.0,
      required: true,
    },
    deliveryLatitude: {
      type: Number,
      default: 0.0,
      required: true,
    },
    deliveryLongitude: {
      type: Number,
      default: 0.0,
      required: true,
    },
    metaData: {
      type: Object,
      default: {},
    },
    email: {
      type: String,
      required: false,
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
    quantity: {
      type: Number,
      required: true,
      default: 0.0,
    },
    riderRated: {
      type: Boolean,
      default: false,
    },
    riderRating: {
      type: ObjectId,
      default: null,
      ref: "Rating",
    },
    userRating: {
      type: ObjectId,
      default: null,
      ref: "Rating",
    },
    userRated: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: ObjectId,
      // ref: "User",
      default: null,
    },
    paymentMethod: {
      type: String,
      default: "cash",
      enum: ["card", "cash", "credit", "wallet"],
    },
    cashPaymentType: {
      type: String,
      enum: ["pickup","delivery"],
    },
    type: {
      // this is used to identify our post either for poll or for personal company request
      type: String,
      enum: ["local", "interState", "international"],
      default: "local",
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
