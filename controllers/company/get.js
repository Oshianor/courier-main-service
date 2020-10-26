const Company = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");

/**
 * Get One Company
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, null, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All Companies
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res) => {
  try {
    const companies = await Company.find({});

    JsonResponse(res, 200, null, companies, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
