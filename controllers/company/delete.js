const Company = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");

/**
 * Delete One Company
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findByIdAndDelete(companyId);

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    JsonResponse(res, 200, MSG_TYPES.DELETED, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
