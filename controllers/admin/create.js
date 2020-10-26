const Joi = require("joi");
const { Admin, validateAdmin } = require("../../models/admin");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");

/**
 * Create Admin
 * @param {*} req
 * @param {*} res
 */
exports.createAdmin = async (req, res) => {
  try {
    const { error } = validateAdmin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if an existing admin has incoming email
    const admins = await Admin.findOne({ email: req.body.email });
    if (admins)
      return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);

    req.body.createdBy = req.user.id;
    const admin = new Admin(req.body);
    await admin.save();

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};
