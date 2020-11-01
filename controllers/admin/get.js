const Joi = require("joi");
const { Admin } = require("../../models/admin");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");

/**
 * Get Single
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res) => {
  try {
    const admins = await Admin.find({});

    JsonResponse(res, 200, null, admins, null);
  } catch (err) {
    console.log(err);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get Current Authenticated Admin
 * @param {*} req
 * @param {*} res
 */
exports.current = async (req, res) => {
  try {
    const admin = await Admin.findOne({ account: req.user.id });
    JsonResponse(res, 200, null, admin, null);
  } catch (err) {
    console.log(err);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};


