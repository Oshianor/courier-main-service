const mongoose = require("mongoose");
const Joi = require("joi");


const vehicleSchema = mongoose.Schema({
  ref: {
    type: String,
  },
  type: {
    type: String,
  },
});

function validateVehicle(data) {
  const Schema = Joi.object().keys({
    type: Joi.string().max(30).label("Vehicle Type").optional(),
  });

  return Schema.validate(data);
}

function validateUpdateVehicle(data) {
  const Schema = Joi.object().keys({
    type: Joi.string().max(30).label("Vehicle Type").optional(),
  });

  return Schema.validate(data);
}

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = {
  validateVehicle,
  validateUpdateVehicle,
  Vehicle,
};
