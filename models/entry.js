const mongoose = require("mongoose");
const Joi = require("joi");
const ObjectId = mongoose.Schema.Types.ObjectId;


const entrySchema = mongoose.Schema(
  {
    sourceType: {
      // this is used to identify our post either for poll or for personal company request
      type: String,
      enum: ["exaltEcommerce", "default", "thirdparty", "company"],
      default: "default",
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
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "cancelled"],
      default: "pending",
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
    pickupTime: {
      type: Date,
      required: true,
    },
    vehicle: {
      type: ObjectId,
      index: true,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

function validateEntry(data) {
  const Schema = Joi.object().keys({
    email: Joi.string().email().max(50).label("Email").required(),
    name: Joi.string().label("Name").required(),
    address: Joi.string().label("Address").required(),
    pickupTime: Joi.date().label("Pick Up Time").required(),
    latitude: Joi.number().label("Latitude").required(),
    longitude: Joi.number().label("Longitude").required(),
    description: Joi.string().label("Description").required(),
    delivery: Joi.array().items({
      email: Joi.string().email().max(50).label("Email").required(),
      name: Joi.string().label("Name").required(),
      address: Joi.string().label("Address").required(),
      deliveryTime: Joi.date().label("Delivery Time").required(),
      latitude: Joi.number().label("Latitude").required(),
      longitude: Joi.number().label("Longitude").required(),
    }),
  });

  return Schema.validate(data);
}


const Entry = mongoose.model("Entry", entrySchema);

module.exports = {
  validateEntry,
  Entry,
};
