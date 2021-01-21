const CreditService = require("../services/credit");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const {
  validateFundWallet,
  validateAdminFundWallet,
} = require("../request/wallet");
const {
  validateRequestFund,
  validateAppproveLoan,
} = require("../request/credit");
const { paginate } = require("../utils");


/**
 * Admin fund wallet for branch or owner
 * @param {*} req
 * @param {*} res
 */
exports.lineOfCredit = async (req, res, next) => {
  try {
    const { error } = validateAdminFundWallet(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const creditInstance = new CreditService();
    await creditInstance.assignCredit(
      req.body,
      req.user
    );

    JsonResponse(res, 200, MSG_TYPES.CREDIT_FUNDED);
    return;
  } catch (error) {
    next(error);
    return;
  }
};


/**
 * Get me wallet details
 * @param {*} req
 * @param {*} res
 */
exports.get = async (req, res, next) => {
  try {
    const creditInstance = new CreditService();
    const credit = await creditInstance.getCredit(req.user.enterprise);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, credit);
    return;
  } catch (error) {
    next(error);
    return;
  }
};


/**
 * Get Enterprise credit accounts
 * @param {*} req
 * @param {*} res
 */
exports.getAllCredit = async (req, res, next) => {
  try {

    const { page, pageSize, skip } = paginate(req);

    const creditInstance = new CreditService();
    const { credit, total } = await creditInstance.getAllCredit(skip, pageSize);

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    
    JsonResponse(res, 200, MSG_TYPES.FETCHED, credit, meta);
  } catch (error) {
    next(error);
  }
};


/**
 * Request credit from admin
 * @param {*} req
 * @param {*} res
 */
exports.requestCredit = async (req, res, next) => {
  try {
    const { error } = validateRequestFund(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const creditInstance = new CreditService();
    await creditInstance.requestCredit(
      req.body,
      req.user
    );

    JsonResponse(res, 200, "Your loan request has been sent and it's await approval.");
    return;
  } catch (error) {
    next(error);
    return;
  }
};

/**
 * Approve credit for Admin
 * @param {*} req
 * @param {*} res
 */
exports.approveByAdminCredit = async (req, res, next) => {
  try {
    const { error } = validateAppproveLoan(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const creditInstance = new CreditService();
    await creditInstance.approveCredit(req.body, req.user);

    JsonResponse(res, 200, `Loan has been successfully ${req.body.status}`);
    return;
  } catch (error) {
    next(error);
    return;
  }
};