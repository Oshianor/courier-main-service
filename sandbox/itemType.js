const mongoose = require("mongoose");
const Joi = require("joi");


const ItemTypeSchema = mongoose.Schema(
  {
    source: {
      type: String,
      index: true,
      required: true,
      default: "Admin",
      enum: ["admin", "company"],
    },
    company: {
      type: String,
      ref: "Company",
      default: null,
      index: true,
    },
    organization: {
      type: String,
      ref: "Organization",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["Document", "Parcel"],
      index: true,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0.0,
    },
    currency: {
      type: String,
      default: "NGN",
    },
  },
  {
    timestamps: true,
  }
);

function validateItemType(data) {
  const Schema = Joi.object().keys({
    type: Joi.string().label("Type").valid("Document", "Parcel").required(),
    price: Joi.number().label("Price").required()
  });

  return Schema.validate(data);
}


function validateUpdateItemType(data) {
  const Schema = Joi.object().keys({
    price: Joi.number().label("Price").optional(),
  });

  return Schema.validate(data);
}

const ItemType = mongoose.model("ItemType", ItemTypeSchema);

module.exports = {
  validateItemType,
  validateUpdateItemType,
  ItemType,
};
