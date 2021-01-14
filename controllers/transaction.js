const Transaction = require("../models/transaction");
const Entry = require("../models/entry");
const Company = require("../models/company");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");
const {
  validateTransaction,
  validateTransactionStatus,
  validateEnterpriseTransaction,
} = require("../request/transaction");
const TransactionService = require("../services/transaction");
const EntryService = require("../services/entry");
const EntrySubscription = require("../subscription/entry");
const RiderSubscription = require("../subscription/rider");
const CompanySubscription = require("../subscription/company");
const NotifyService = require("../services/notification");
const UserService = require("../services/user");



/**
 * User confirm payment method and entry
 * @param {*} req
 * @param {*} res
 */
exports.transaction = async (req, res, next) => {
  try {
    const { error } = validateTransaction(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const transactionInstance = new TransactionService();
    const { entry, msg } = await transactionInstance.createTransaction(req.body, req.user, req.token);

    console.log("entry", entry);

    // socket.to(entry.state).emit(SERVER_EVENTS.NEW_ENTRY, entry);
    const companySub = new CompanySubscription();
    await companySub.dispatchToStateRoom(entry);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 201, msg);
    return;
  } catch (error) {
    console.log(error);
    return next(error);
  }
};


/**
 * enterprise confirm payment method and entry
 * @param {*} req
 * @param {*} res
 */
exports.enterpriseTransaction = async (req, res) => {
  try {
    const { error } = validateEnterpriseTransaction(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const transactionInstance = new TransactionService();
    const { entry, msg } = await transactionInstance.createEnterpriseTransaction(req.body, req.user, req.enterprise);

    // const entryInstance = new EntryService();
    // const { entry, riderIDS } = await entryInstance.riderAsignEntry(
    //   req.body,
    //   req.user
    // );

    // // send entries to all the rider
    // const riderSub = new RiderSubscription();
    // await riderSub.sendRidersEntries(riderIDS, entry);

    console.log("entry", entry);


    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 201, msg);
    return;
  } catch (error) {
    return next(error);
  }
};



/**
 * Rider confirm user cash payment at pickup location
 * @param {*} req
 * @param {*} res
 */
exports.riderConfirmCashPayment = async (req, res) => {
  try {
    const { error } = validateTransactionStatus(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

      const entryInstance = new EntryService();
      const { entry, code, msg } = await entryInstance.riderConfirmCashPayment(
        req.body,
        req.user
      );

      // send fcm notification
      // send nofication to the user device
      const title = "Your payment has been confirmed. Thank you";
      const notifyInstance = new NotifyService();
      await notifyInstance.textNotify(title, "", entry.user.FCMToken);

      // send socket to admin for update
      const entrySub = new EntrySubscription();
      await entrySub.updateEntryAdmin(entry._id);
    

    JsonResponse(res, code, msg);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};



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
exports.allByUser = async (req, res) => {
  try {

    const { page, pageSize, skip } = paginate(req);
    const filter = { user: req.user.id };

    const total = await Transaction.countDocuments(filter);
    const transaction = await Transaction.find(filter)
      .select('-_id txRef entry user rider paymentMethod amount status createdAt')
      .populate('rider', '-_id name email')
      .populate('entry', '-_id itemType description')
      .skip(skip)
      .limit(pageSize);

    // if (transaction.length < 1) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transaction, meta);
  } catch (err) {
    console.log(err);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Get All
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res) => {
  try {

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
