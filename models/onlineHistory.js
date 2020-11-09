const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;


const riderSchema = new mongoose.Schema(
  {
    rider: {
      type: ObjectId,
      required: true,
      ref: "Rider",
      index: true,
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
  },
  {
    timestamps: true,
  }
);

const OnlineHistory = mongoose.model("OnlineHistory", riderSchema);

module.exports = {
  OnlineHistory,
};
