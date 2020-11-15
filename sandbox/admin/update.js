const {
  Admin,
  validateUpdateAdmin,
  validatePassword,
} = require("../../models/admin");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const bcrypt = require("bcrypt");

exports.current = async (req, res) => {
  try {
    const { error } = validateUpdateAdmin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);
    const admin = await Admin.findOne({ _id: req.user.id });
    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    await Admin.updateOne({ _id: req.user.id }, req.body);

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

exports.password = async (req, res) => {
  try {
    const { error } = validatePassword(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);
    const admin = await Admin.findOne({ _id: req.user.id });
    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    let validPassword = await bcrypt.compare(
      req.body.oldPassword,
      admin.password
    );

    if (!validPassword) {
      JsonResponse(res, 403, MSG_TYPES.INVALID_PASSWORD, null, null);
    }

    admin.password = await bcrypt.hash(req.body.password, 10);

    await admin.save();

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

exports.disable = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const admin = await Admin.findOne({ _id: adminId });

    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    admin.disabled = true;
    await admin.save();
    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

exports.enable = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const admin = await Admin.findOne({ _id: adminId });

    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    admin.disabled = false;
    await admin.save();
    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
