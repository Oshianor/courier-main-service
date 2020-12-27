const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      index: true,
      required: true,
      minlength: 5,
      maxlength: 50,
    },
    phoneNumber: String,
    name: String,
    country: String,
    state: String,
    countryCode: String,
    address: String,
    img: String,
    FCMToken: {
      type: String,
      default: null,
    },
    lastAccountUpdateDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
  }
);


const User = mongoose.model("User", UserSchema);

module.exports = User;
