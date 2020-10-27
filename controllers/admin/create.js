const Joi = require("joi");
const { Admin, validateAdmin } = require("../../models/admin");
const { Account } = require("../../models/account");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../../constant/types");
const { to } = require("await-to-js");
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
    const adminCheck = await Account.findOne({ email: req.body.email });
    if (adminCheck)
      return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);

    let err, admin;
    req.body.type = ACCOUNT_TYPES.ADMIN;
    const account = await Account.create(req.body);
    // req.body.createdBy = req.user.id;
    req.body.account = account._id;
    [err, admin] = await to(Admin.create(req.body));
    if (err) {
      //on admin failure remove account
      await Account.deleteOne({ email: req.body.email });
      throw err;
    }
    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};
