const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const ratingSchema = new mongoose.Schema(
  {
    rider: {
      type: ObjectId,
      index: true,
      ref: "Rider",
      required: true,
    },
    user: {
      type: ObjectId,
      index: true,
      ref: "User",
      required: true,
    },
    source: {
      type: String,
      enum: ["rider", "user"]
    },
    entry: {
      type: ObjectId,
      index: true,
      ref: "Entry"
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);


const Rating = mongoose.model("Rating", ratingSchema);

module.exports = Rating;
