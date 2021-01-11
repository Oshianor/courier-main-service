const EnterpriseService = require("../services/enterprise");
const { validateEnterprise, validateMaintainer, validateEnterpriseUpdate } = require("../request/enterprise");
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

    const branch = await enterpriseInstance.createBranch(req.body, req.files, req.enterprise);
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

    const maintainer = await enterpriseInstance.createMaintainer(req.body, req.enterprise);
    return JsonResponse(res, 200, MSG_TYPES.CREATED, maintainer);

  } catch (error) {
    next(error)
    return
  }
};


/**
 * Add card for enterprise accounts
 * @param {*} req 
 * @param {*} res 
 */
exports.addCard = async (req, res, next) => {
  try {
    const card = await enterpriseInstance.addCard(req.body, req.token);
    return JsonResponse(res, 200, card.data.msg, card.data.data);
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Update enterprise information
 * @param {*} req 
 * @param {*} res 
 */
exports.updateEnterprise = async (req, res, next) => {
  try {
    const { error } = validateEnterpriseUpdate(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    const enterpriseId = req.enterprise._id;
    await enterpriseInstance.updateEnterprise({ _id: enterpriseId }, req.body);
    return JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Get enterprise information
 * @param {*} req 
 * @param {*} res 
 */
exports.getEnterprise = async (req, res, next) => {
  try {
    const enterprise = await enterpriseInstance.getEnterprise({ email: req.enterprise.email });
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, enterprise);
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Get All Enterprise branches
 * @param {*} req
 * @param {*} res
 */
exports.allBranches = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const { enterpriseBranches, totalBranches } = await enterpriseInstance.getAllBranches(
      req.enterprise._id,
      skip,
      pageSize
    );
    const meta = {
      totalBranches,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, enterpriseBranches, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Get All Enterprise maintainers
 * @param {*} req
 * @param {*} res
 */
exports.allMaintainers = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const { enterpriseMaintainers, totalMaintainers } = await enterpriseInstance.getAllMaintainers(
      req.enterprise._id,
      skip,
      pageSize
    );
    const meta = {
      totalMaintainers,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, enterpriseMaintainers, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};
