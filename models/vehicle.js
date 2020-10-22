const mongoose = require("mongoose");

const vehicleSchema = mongoose.Schema({
  ref: {
    type: String,
  },
  type: {
    type: String,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);