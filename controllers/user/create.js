const { User, validateUser } = require("../../models/users");
const config = require("config");
const { JsonResponse } = require("../../lib/apiResponse");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const ObjectId = mongoose.Types.ObjectId;
const { Mailer } = require("../../utils");

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

CreateUser = async (req, res) => {
  try {
    // validate request
    const { error } = validateUser(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if account exist
    const userExist = await User.findOne({ email: req.body.email });
    if (userExist) return JsonResponse(res, 400, "ACCOUNT_EXIST", null, null);

    // create new account record
    const newUser = new User(req.body);
    newUser.password = await bcrypt.hash(newUser.password, 10);
    newUser.email.toLowerCase();
    await newUser.save();

    
    JsonResponse(res, 200, "ACCOUNT_CREATED", null, null);
    return;
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
};

module.exports = {
  CreateUser,
};
