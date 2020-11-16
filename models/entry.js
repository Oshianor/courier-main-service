const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;


const entrySchema = mongoose.Schema(
  {
    source: {
      // this is used to identify our post either for poll or for personal company request
      type: String,
      enum: ["exaltEcommerce", "pool", "company"],
      default: "pool",
    },
    user: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    orders: [{ type: ObjectId, ref: "Order", required: true }],
    company: {
      type: ObjectId,
      index: true,
      ref: "Company",
      default: null,
    },
    rider: {
      type: ObjectId,
      index: true,
      ref: "Rider",
      default: null,
    },
    transaction: {
      type: ObjectId,
      index: true,
      ref: "Transaction",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "request", // when the request is made without payment method added
        "pending", // when it's in the pool await company
        "companyAccepted", // when a company accepts the order
        "driverAccepted", // when a driver accepts the order
        "onGoing", // when atleast order is in pickup or delivery
        "completed", // when all orders are conpleted.
        "cancelled", // when the order is cancelled
      ],
      default: "request",
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    companyAcceptedAt: {
      type: Date,
      default: null,
    },
    driverAcceptedAt: {
      type: Date,
      default: null,
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
    pickupTime: {
      type: Date,
      required: true,
    },
    vehicle: {
      type: ObjectId,
      index: true,
      required: true,
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
    TEC: {
      //total estimated cost
      type: Number,
      required: true,
    },
    TED: {
      //total estimated distance
      type: Number,
      required: true,
    },
    TET: {
      //total estimated time
      type: Number,
      required: true,
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
    description: {
      type: String,
      default: "",
      required: true,
      maxLenght: 3000,
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

const Entry = mongoose.model("Entry", entrySchema);

module.exports = Entry;
