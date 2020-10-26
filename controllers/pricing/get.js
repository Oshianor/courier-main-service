const { User } = require("../../models/users");
const { JsonResponse } = require("../../lib/apiResponse");
const mongoose = require("mongoose");


GetUser = async (req, res) => {
  try {
    // check if account exist
    const user = await User.findOne({ email: req.user.email }).select({ password: 0 });

    JsonResponse(res, 200, "ACCOUNT_CREATED", user, null);
    return;
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
};

module.exports = {
  GetUser,
};
