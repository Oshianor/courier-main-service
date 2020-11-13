const { Transaction } = require("../../models/transaction");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { paginate } = require("../../utils");

/**
 * Get All
 * @param {*} req
 * @param {*} res
 */
exports.allByAdmin = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const transactions = await Transaction.find({})
      .populate("user")
      .populate("rider")
      .skip(skip)
      .limit(pageSize);

    const total = await Transaction.find({}).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transactions, meta);
  } catch (err) {
    console.log(err);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const transaction = await Transaction.findOne({
      _id: req.params.id,
    })
      .populate("user")
      .populate("rider");

    if (!transaction) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transaction, null);
  } catch (err) {
    console.log(err);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
