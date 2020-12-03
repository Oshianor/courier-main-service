const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const ratingSchema = new mongoose.Schema(
  {
    ratingFrom: {
      type: ObjectId,
      index: true,
      ref: "Rider",
      required: true,
    },
    ratingTo: {
      type: ObjectId,
      index: true,
      ref: "User",
      required: true,
    },
    order: {
      type: ObjectId,
      index: true,
      ref: "Order",
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    comment: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);


const Rating = mongoose.model("Rating", ratingSchema);

module.exports = Rating;
