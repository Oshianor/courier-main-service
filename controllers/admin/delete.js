const { Admin } = require("../../models/admin");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");

/**
 * Delete One Admin
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const admin = await Admin.findOne({ _id: adminId });

    if (!admin) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    admin.deletedBy = req.user.id;
    admin.deleted = true;
    admin.deletedAt = Date.now();
    await admin.save();
    JsonResponse(res, 200, MSG_TYPES.DELETED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
