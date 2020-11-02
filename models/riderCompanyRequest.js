const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;


const riderCompanyRequestSchema = new mongoose.Schema(
  {
    rider: {
      type: ObjectId,
      ref: "Rider",
      required: true,
      index: true,
    },
    company: {
      type: ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "declined", "approved"],
      default: "approved",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);


const RiderCompanyRequest = mongoose.model("Rider", riderCompanyRequestSchema);

module.exports = {
  RiderCompanyRequest,
};
