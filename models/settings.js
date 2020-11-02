const mongoose = require("mongoose");
const Joi = require("joi");


const vehicleSchema = mongoose.Schema(
  {
    country: {
      type: String,
      index: true,
      required: true,
    },
    state: {
      type: String,
      index: true,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ["km", "m"],
      required: true,
      default: "km",
    },
  },
  {
    timestamps: true,
  }
);

function validateUpdateVehicle(data) {
  const Schema = Joi.object().keys({
    type: Joi.string().max(30).label("Vehicle Type").optional(),
    price: Joi.number().label("Vehicle Price").optional(),
  });

  return Schema.validate(data);
}

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = {
  validateVehicle,
  validateUpdateVehicle,
  Vehicle,
};
