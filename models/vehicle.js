const mongoose = require("mongoose");


const vehicleSchema = mongoose.Schema(
  {
    ref: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
