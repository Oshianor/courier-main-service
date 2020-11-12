const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const Joi = require("joi");

const RiderEntryRequestSchema = new mongoose.Schema(
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
    entry: {
      type: ObjectId,
      ref: "Entry",
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const RiderEntryRequest = mongoose.model(
  "RiderEntryRequest",
  RiderEntryRequestSchema
);

function validateStatusUpdate(body) {
  const schema = Joi.object({
    status: Joi.string().required().valid("pending", "approved", "declined"),
  });

  return schema.validate(body);
}

module.exports = {
  RiderEntryRequest,
  validateStatusUpdate,
};
