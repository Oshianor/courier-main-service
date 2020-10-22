const Joi = require("joi");
const Admin = require("../../models/admin");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");

/**
 * Create
 * @param {*} req
 * @param {*} res
 */
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({});

    JsonResponse(res, 200, null, admins, null);
  } catch (err) {
    console.log(err);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
