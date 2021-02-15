const WalletService = require("../services/wallet");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const {
  validateFundWallet,
  validateAdminFundWallet,
} = require("../request/wallet");
const { paginate } = require("../utils");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;



/**
 * Create wallet account
 * @param {*} req
 * @param {*} res
 */
exports.createWallet = async (req, res, next) => {
  try {

    const walletInstance = new WalletService();
    const wallet = await walletInstance.createWallet(req.body.enterprise);

    JsonResponse(res, 201, "ok", wallet);
    return;
  } catch (error) {
    next(error);
    return;
  }
};


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

    JsonResponse(res, 200, MSG_TYPES.WALLET_FUNDED);
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

    console.log("req.user", req.user);
    
    const walletInstance = new WalletService();
    const wallet = await walletInstance.getWallet(req.user.enterprise);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, wallet);
    return;
  } catch (error) {
    next(error);
    return;
  }
};


/**
 * Get my wallet history
 * @param {*} req
 * @param {*} res
 */
exports.walletHistory = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const walletInstance = new WalletService();
    const { history, total } = await walletInstance.walletHistory(
      req.user,
      skip,
      pageSize
    );

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, history, meta);
    return;
  } catch (error) {
    next(error);
    return;
  }
};



/**
 * get all wallet address by admin
 * @param {*} req
 * @param {*} res
 */
exports.getWalletByAdmin = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const walletInstance = new WalletService();
    const { wallet, total } = await walletInstance.getAllWallet(skip, pageSize);

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, wallet, meta);
    return;
  } catch (error) {
    next(error);
    return;
  }
};


/**
 * get all wallet address by admin
 * @param {*} req
 * @param {*} res
 */
exports.disableWallet = async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.wallet)) {
      JsonResponse(res, 200, "Wallet Id provided is invalid", wallet);
      return;
    }

    const walletInstance = new WalletService();
    const wallet = await walletInstance.disableAWallet(req.params);

    JsonResponse(res, 200, `Wallet account is successfully ${wallet.status}`, wallet);
    return;
  } catch (error) {
    next(error);
    return;
  }
};


/**
 * get a wallet history
 * @param {*} req
 * @param {*} res
 */
exports.singleWalletHistory = async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.wallet)) {
      JsonResponse(res, 200, "Wallet Id provided is invalid", wallet);
      return;
    }

    const { page, pageSize, skip } = paginate(req);

    const walletInstance = new WalletService();
    const { history, total } = await walletInstance.singleWalletHistory(
      req.params,
      skip,
      pageSize
    );

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, history, meta);
    return;
  } catch (error) {
    next(error);
    return;
  }
};