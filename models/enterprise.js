const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;


const enterPriseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: 50,
      required: true,
    },
    enterprise: {
      type: ObjectId,
      default: null,
      index: true,
      ref: "Enterprise",
    },
    user: {
      type: ObjectId,
      index: true,
      required: true,
      ref: "User",
    },
    type: {
      type: String,
      required: true,
      enum: ["owner", "branch"],
    },
    email: {
      type: String,
      maxlength: 50,
      required: true,
    },
    phoneNumber: {
      type: String,
      maxlength: 50,
      required: true,
    },
    countryCode: String,
    address: {
      type: String,
      maxlength: 150,
      required: true,
    },
    logo: {
      type: String,
    },
    primaryColors: [String],
    secondaryColors: [String],
    motto: { type: String, maxlength: 225, default: "" },
    industry: String,
    users: [
      {
        type: ObjectId,
        index: true,
        required: true,
        ref: "User",
      },
    ],
    usersAll: [
      {
        type: ObjectId,
        index: true,
        required: true,
        ref: "User",
      },
    ],
    maintainers: [{ type: ObjectId, ref: "User", index: true }],
    branchUserIDS: [{ type: ObjectId, ref: "User", index: true }],
    branchIDS: [{ type: ObjectId, ref: "Enterprise", index: true }],
    branchIDSWithHQ: [{ type: ObjectId, ref: "Enterprise", index: true }],
    wallet: {
      type: ObjectId,
      required: true,
      ref: "Wallet",
    },
    credit: {
      type: ObjectId,
      required: true,
      ref: "Credit",
    },
    HQ: {
      type: ObjectId,
      index: true,
    },
    status: {
      type: String,
      enum: ["inactive", "active", "suspended"],
      default: "inactive",
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
      required: true,
    },
    createdBy: {
      type: ObjectId,
      ref: "Admin",
      default: null,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: ObjectId,
      default: null,
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


const Enterprise = mongoose.model("Enterprise", enterPriseSchema);

module.exports = Enterprise;
