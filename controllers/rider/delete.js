const { Company } = require("../../models/company");
const { Rider } = require("../../models/rider");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");

/**
 * Delete One Rider
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const company = await Company.findOne({ account: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const riderId = req.params.riderId;
    const rider = await Rider.findOne({ _id: riderId });

    if (!rider) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    rider.deletedBy = req.user.id;
    rider.isDeleted = true;
    rider.deletedAt = Date.now();
    await rider.save();
    JsonResponse(res, 200, MSG_TYPES.DELETED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
