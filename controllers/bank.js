const { MSG_TYPES } = require("../constant/types");
const { JsonResponse } = require("../lib/apiResponse");
const BankService = require("../services/bank")
const {
  validateBankDetail,
  validateResolveBankAccount
} = require('../request/bank')
const { paginate } = require("../utils/index")


/**
 * create Bank Detail
 * @param {*} req
 * @param {*} res
 * @param {*} next
*/
exports.create = async (req, res, next) => {
  try {
    req.body.rider = req.user.id;

    const { error } = validateBankDetail(req.body)
    if (error) return JsonResponse(res, 400, error.details[0].message);

    await BankService.create(req.body)
    return JsonResponse(res, 200, MSG_TYPES.CREATED);

  } catch (error) {
    next(error);
  }
}

/**
 * get all rider banks
 * @param {*} req
 * @param {*} res
 * @param {*} next
*/
exports.getAll = async (req, res, next) => {
  try {
    const rider = req.user.id
    const { page, pageSize, skip } = paginate(req)

    const { bankDetails, total } = await BankService.getAllBankDetails(
      rider, skip, pageSize
    )
    const meta = {
      total,
      pagination: { pageSize, page }
    }
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, bankDetails, meta)
  } catch (error) {
    next(error);
  }
}

/**
 * set default bank
 * @param {*} req
 * @param {*} res
 * @param {*} next
*/
exports.setDefault = async (req, res, next) => {
  try {
    await BankService.setDefault(req)
    return JsonResponse(res, 200, MSG_TYPES.UPDATED)
  } catch (error) {
    next(error);
  }
}

/**
 * delete bank detail
 * @param {*} req
 * @param {*} res
 * @param {*} next
*/
exports.deleteBank = async (req, res, next) => {
  try {
    await BankService.removeBank(req)
    return JsonResponse(res, 200, MSG_TYPES.DELETED)
  } catch (error) {
    next(error);
  }
}

/**
 * List available banks [From paystack]
 * @param {*} req
 * @param {*} res
 * @param {*} next
*/
exports.listBanks = async (req, res, next) => {
  try {
    let banks = await BankService.listBanks();
    JsonResponse(res, 200, MSG_TYPES.FETCHED, banks);
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve bank account number [With paystack]
 * @param {*} req
 * @param {*} res
 * @param {*} next
*/
exports.resolveAccount = async (req, res, next) => {
  try {
    const { error } = validateResolveBankAccount(req.query)
    if (error) return JsonResponse(res, 400, error.details[0].message);

    let bankAccountData = await BankService.resolveAccount(req.query);
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, bankAccountData);
  } catch (error) {
    next(error);
  }
}