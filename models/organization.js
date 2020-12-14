const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const organizerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: 30,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    publicToken: {
      type: String,
      required: true,
      index: true,
      unique: true,
      maxlength: 50,
    },
    companyHQ: {
      type: ObjectId,
      ref: "Company",
      required: true,
    },
    companies: {
      type: [ObjectId],
      ref: "Company",
      required: true,
    },
    companyBranches: {
      type: [ObjectId],
      ref: "Company",
      required: true,
      default: [],
    },
    cac: {
      type: String,
      required: true,
    },
    poi: {
      type: String,
      required: true,
    },
    poa: {
      type: String,
      required: true,
    },
    insuranceCert: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    createdBy: {
      type: ObjectId,
      ref: "Admin",
    },
    totalRiders: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: ObjectId,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


const Organization = mongoose.model("Organization", organizerSchema);

module.exports = Organization;
