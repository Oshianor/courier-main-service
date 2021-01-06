const EnterpriseService = require("../services/enterprise");
const { validateEnterprise, validateMaintainer } = require("../request/enterprise");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");
const enterpriseInstance = new EnterpriseService();

/**
 * Create organization
 * @param {*} req 
 * @param {*} res 
 */
exports.createOrganization = async (req, res, next) => {
  try {
    const { error } = validateEnterprise(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const enterprise = await enterpriseInstance.createOrganization(req.body, req.files);
    return JsonResponse(res, 200, MSG_TYPES.CREATED, enterprise);

  } catch (error) {
    next(error)
    return
  }
};

/**
 * Create branch
 * @param {*} req 
 * @param {*} res 
 */
exports.createBranch = async (req, res, next) => {
  try {
    const { error } = validateEnterprise(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const branch = await enterpriseInstance.createBranch(req.body, req.files);
    return JsonResponse(res, 200, MSG_TYPES.CREATED, branch);

  } catch (error) {
    next(error)
    return
  }
};

/**
 * Create maintainer
 * @param {*} req 
 * @param {*} res 
 */
exports.createMaintainer = async (req, res, next) => {
  try {
    const { error } = validateMaintainer(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const maintainer = await enterpriseInstance.createMaintainer(req.body);
    return JsonResponse(res, 200, MSG_TYPES.CREATED, maintainer);

  } catch (error) {
    next(error)
    return
  }
};
