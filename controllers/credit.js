const CreditService = require("../services/credit");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const {
  validateFundWallet,
  validateAdminFundWallet,
} = require("../request/wallet");
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


// /**
//  * Get my wallet history
//  * @param {*} req
//  * @param {*} res
//  */
// exports.creditHistory = async (req, res, next) => {
//   try {
//     const { page, pageSize, skip } = paginate(req);

//     const walletInstance = new WalletService();
//     const { history, total } = await walletInstance.walletHistory(
//       req.user,
//       skip,
//       pageSize
//     );

//     const meta = {
//       total,
//       pagination: { pageSize, page },
//     };

//     JsonResponse(res, 200, MSG_TYPES.FETCHED, history, meta);
//     return;
//   } catch (error) {
//     next(error);
//     return;
//   }
// };
