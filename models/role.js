const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  resources: [
    {
      name: String, //like Transactions
      permissions: [String], //link ['create', 'read', 'update', 'delete]
    },
  ],
});

module.exports = mongoose.model("Role", roleSchema);
