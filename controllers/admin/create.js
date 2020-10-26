const Joi = require("joi");
const Admin = require("../../models/admin");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");

/**
 * Create Admin
 * @param {*} req
 * @param {*} res
 */
exports.createAdmin = async (req, res) => {
  try {
    adminSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      password: Joi.string()
        .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
        .required(),
      repeat_password: Joi.ref("password"),
      role: Joi.string().required().valid("super_admin", "admin"),
    }).with("password", "repeat_password");

    const { error } = adminSchema.validate(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }

    // check if an existing admin has incoming email
    const admins = await Admin.find({ email: req.body.email });

    if (admins.length > 0) {
      return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);
    }

    const admin = new Admin();
    admin.name = req.body.name;
    admin.email = req.body.email;
    admin.password = req.body.password;
    admin.role = req.body.role;
    await admin.save();

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};
