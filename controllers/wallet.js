const WalletService = require("../services/wallet");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { validateFundWallet } = require("../request/wallet")

/**
 * Fund wallet by onwer and branch
 * @param {*} req
 * @param {*} res
 */
exports.fundWallet = async (req, res, next) => {
  try {
    const { error } = validateFundWallet(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const walletInstance = new WalletService();
    const { wallet } = await walletInstance.fundWallet(req.body, req.user, req.token);

    JsonResponse(res, 200, MSG_TYPES.WALLET_FUNDED, wallet);
    return;
  } catch (error) {
    next(error);
    return;
  }
};
