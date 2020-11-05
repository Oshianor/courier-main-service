const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const Joi = require("joi");

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

const RiderCompanyRequest = mongoose.model(
  "RiderCompanyRequest",
  riderCompanyRequestSchema
);

function validateStatusUpdate(body) {
  const schema = Joi.object({
    status: Joi.string().required().valid("pending", "approved", "declined"),
  });

  return schema.validate(body);
}

module.exports = {
  RiderCompanyRequest,
  validateStatusUpdate,
};
