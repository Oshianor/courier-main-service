const mongoose = require("mongoose");

const industryCategorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const IndustryCategory = mongoose.model("IndustryCategory", industryCategorySchema);

module.exports = IndustryCategory;
