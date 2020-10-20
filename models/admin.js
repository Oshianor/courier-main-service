const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const config = require("config");

const adminSchema = new mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    enum: ["super_admin", "admin"],
  },
});

// hash passwords for new records before saving
adminSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.password = await bcrypt.hash(this.password, 13);
  }
  next();
});

//validate admin's password
adminSchema.methods.isValidPassword = async function (inputedPassword) {
  let validPassword = await bcrypt.compare(inputedPassword, this.password);
  return validPassword;
};

//sign token for this admin
adminSchema.methods.generateToken = function () {
  return JWT.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      adminId: this._id,
    },
    config.get("application.jwt.key")
  );
};

module.exports = mongoose.model("Admin", adminSchema);
