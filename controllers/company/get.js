const { Company } = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");


/**
 * Get me
 * @param {*} req
 * @param {*} res
 */
exports.me = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    })
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority");

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};


/**
 * Get One Company by Admin
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

    JsonResponse(res, 200, MSG_TYPES.FETCHED, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All Companies by Admin
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res) => {
  try {
    const page = typeof req.query.page !== "undefined" ? Math.abs(req.query.page) : 1;
    const pageSize = typeof req.query.pageSize !== "undefined" ? Math.abs(req.query.page) : 50;
    const skip = (page - 1) * pageSize;

    const companies = await Company.find().skip(skip).limit(pageSize);
    const total = await Company.find().countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page }
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
