const { Company } = require("../../models/company");
const { Rider } = require("../../models/rider");
const { Setting } = require("../../models/settings");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { paginate } = require("../../utils");
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
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
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
    const company = await Company.findOne({ _id: companyId })
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
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
 * Get All Companies by Admin
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const companies = await Company.find({ deleted: false })
      .populate("vehicles")
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("tier", "name type price transactionCost priority")
      .skip(skip)
      .limit(pageSize);
    const total = await Company.find().countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All unveried Companies by Admin
 * @param {*} req
 * @param {*} res
 */
exports.allUnveried = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const companies = await Company.find({ verified: false, deleted: false })
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority")
      .skip(skip)
      .limit(pageSize);
    const total = await Company.find({ verified: false }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};


/**
 * Get Recruiting Company
 * @param {*} req
 * @param {*} res
 */
exports.recruiting = async (req, res) => {
  try {
    const settings = await Setting.find({
      recruitment: true,
      source: "company",
    });

    console.log("settings", settings);

    const companyIds = settings.map((v, i) => { return v.company });
    console.log("companyIds", companyIds);

    const companies = await Company.find({
      _id: { $in: companyIds },
      verified: true,
      deleted: false,
    })
      .select("name state country")

    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, null);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
