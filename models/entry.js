const mongoose = require("mongoose");
const Joi = require("joi");
const ObjectId = mongoose.Schema.Types.ObjectId;


const entrySchema = mongoose.Schema(
  {
    sourceType: {
      // this is used to identify our post either for poll or for personal company request
      type: String,
      enum: ["exaltEcommerce", "poll", "company"],
      default: "poll",
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
  },
  {
    timestamps: true,
  }
);

function validateLocalEntry(data) {
  const Schema = Joi.object().keys({
    email: Joi.string().email().max(50).label("Email").required(),
    isUserDetails: Joi.bool().required(),
    name: Joi.string().label("Name").required(),
    pickupTime: Joi.date().label("Pick Up Time").required(),
    latitude: Joi.number().label("Latitude").required(),
    longitude: Joi.number().label("Longitude").required(),
    description: Joi.string().label("Description").required(),
    vehicle: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .label("Vehicle")
      .required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    city: Joi.string().label("City").required(),
    postCode: Joi.string().label("Post Code").required(),
    delivery: Joi.array().items({
      email: Joi.string().email().max(50).label("Email").required(),
      isUserDetails: Joi.bool().required(),
      name: Joi.string().label("Name").required(),
      itemName: Joi.string().label("Item Name").required(),
      itemType: Joi.string()
        .label("Item Type")
        .valid("Document", "Parcel")
        .required(),
      deliveryTime: Joi.date().label("Delivery Time").required(),
      latitude: Joi.number().label("Latitude").required(),
      longitude: Joi.number().label("Longitude").required(),
      // img: Joi.array()
      //   .items(Joi.string().base64().label("Item Image").allow("").required())
      //   .max(4)
      //   .required(),
      country: Joi.string().label("Country").required(),
      state: Joi.string().label("State").required(),
      city: Joi.string().label("City").required(),
      postCode: Joi.string().label("Post Code").required(),
      weight: Joi.number().label("Weight").required(),
      quantity: Joi.number().label("Quantity").required(),
    }),
  });

  return Schema.validate(data);
}


const Entry = mongoose.model("Entry", entrySchema);

module.exports = {
  validateLocalEntry,
  Entry,
};
