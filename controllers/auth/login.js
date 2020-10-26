const Joi = require("joi");
const Admin = require("../../models/admin");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");
const { User, validateLogin } = require("../../models/users");
const config = require("config");
const bcrypt = require("bcrypt");

exports.LoginAsUser = async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // find the user trying to login
    const user = await User.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
    });
    if (!user) return JsonResponse(res, 400, "ACCOUNT_INVALID", null, null);

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword)
      return JsonResponse(res, 400, "ACCOUNT_INVALID", null, null);

    let token = user.generateToken();

    res.header("x-auth-token", token);
    JsonResponse(res, null, "LOGGED_IN", null, null);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};

/**
 * Admin Login
 * @param {*} req
 * @param {*} res
 */
exports.adminLogin = async (req, res) => {
  try {
    adminSchema = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

    const { error } = adminSchema.validate(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }

    const admin = await Admin.findOne({ email: req.body.email });
    if (!admin) {
      return JsonResponse(res, 401, "Invalid Credentials!", null, null);
    }
    if (!admin.isValidPassword(req.body.password)) {
      return JsonResponse(res, 401, "Invalid Credentials!", null, null);
    }
    let token = admin.generateToken();

    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, { token, admin }, null);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};