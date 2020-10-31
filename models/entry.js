const mongoose = require("mongoose");
const Joi = require("joi");


const entrySchema = mongoose.Schema({
  ref: {
    type: String,
    required: true,
    index: true,
  },
});

function validateVehicle(data) {
  const Schema = Joi.object().keys({
    type: Joi.string().max(30).label("Vehicle Type").required(),
    price: Joi.number().label("Vehicle Price").required(),
  });

  return Schema.validate(data);
}


const Entry = mongoose.model("Entry", entrySchema);

module.exports = {
  validateVehicle,
  validateUpdateVehicle,
  Entry,
};
