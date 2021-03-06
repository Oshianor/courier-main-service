const Transaction = require("../models/transaction");
const Entry = require("../models/entry");
const Company = require("../models/company");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");
const {populateMultiple, populateSingle} = require("../services/aggregate");

const {
  validateTransaction,
  validateTransactionStatus,
  validateEnterpriseTransaction,
  validateBulkEntryTransaction
} = require("../request/transaction");
const TransactionService = require("../services/transaction");
const EntryService = require("../services/entry");
const EntrySubscription = require("../subscription/entry");
const RiderSubscription = require("../subscription/rider");
const CompanySubscription = require("../subscription/company");
const NotifyService = require("../services/notification");
const UserService = require("../services/user");
const RiderService = require("../services/rider");



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


    const companySub = new CompanySubscription();
    await companySub.dispatchToStateRoom(entry);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 201, msg);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * enterprise confirm payment method and entry
 * @param {*} req
 * @param {*} res
 */
exports.enterpriseTransaction = async (req, res, next) => {
  try {
    const { error } = validateEnterpriseTransaction(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const transactionInstance = new TransactionService();
    const { entry, msg } = await transactionInstance.createEnterpriseTransaction(req.body, req.user, req.enterprise);

    const entryInstance = new EntryService();
    const { riderIDS } = await entryInstance.silentlyAsignRiderToEntry(entry);

    if (riderIDS) {
      // send entries to all the rider
      const riderSub = new RiderSubscription();
      await riderSub.sendRidersEntries(riderIDS, entry);
    }

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 201, msg);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * enterprise confirm payment method and entry [for bulk entry]
 * @param {*} req
 * @param {*} res
 */
exports.bulkEntryTransaction = async (req, res, next) => {
  try {
    const { error } = validateBulkEntryTransaction(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const transactionInstance = new TransactionService();
    const { shipment, msg } = await transactionInstance.createBulkEntryTransaction(req.body, req.user, req.enterprise);

    JsonResponse(res, 201, msg);

    for(let entry of shipment.entries){
      // // send socket to admin for update
      const entrySub = new EntrySubscription();
      await entrySub.updateEntryAdmin(entry._id);

      const entryInstance = new EntryService();
      const { riderIDS } = await entryInstance.silentlyAsignRiderToEntry(entry);

      if (riderIDS) {
        // send entries to all the rider
        const riderSub = new RiderSubscription();
        await riderSub.sendRidersEntries(riderIDS, entry);
      }
    }


  } catch (error) {
    next(error);
  }
};

/**
 * Rider confirm user cash payment at pickup location
 * @param {*} req
 * @param {*} res
 */
exports.riderConfirmCashPayment = async (req, res, next) => {
  try {
    const { error } = validateTransactionStatus(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    let entryId = req.body.entry;
    let responseMessage = '';
    let responseCode = 200;
    if(req.body.type === "pickup" && req.body.entry){
      let { entry, code, msg } = await entryInstance.riderConfirmCashPayment(
        req.body,
        req.user
      );

      entryId = entry._id;
      responseCode = code;
      responseMessage = msg;

      // send fcm notification
      // send nofication to the user device
      const title = "Your payment has been confirmed. Thank you";
      const notifyInstance = new NotifyService();
      await notifyInstance.textNotify(title, "", entry.user.FCMToken);

    } else {
      // type is to be "delivery" and order Id is provided
      const { entry, code, msg } = await entryInstance.riderConfirmCashPaymentAtDelivery(req.body, req.user);
      entryId = entry._id;
      responseCode = code;
      responseMessage = msg;
    }

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entryId);

    // Get rider basket
    const riderInstance = new RiderService();
    const riderBasket = await riderInstance.getRiderBasket(req.user);

     // send socket event to enterprise to enable confirm-pickup button(if payment is on pickup)
    if(req.body.type === "pickup"){
      await entrySub.updateEnterpriseEntry(entryId);
    }

    JsonResponse(res, responseCode, responseMessage, riderBasket);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Get All
 * @param {*} req
 * @param {*} res
 */
exports.allByAdmin = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    let transactions = await Transaction.find({})
      // .populate("user")
      .populate("rider")
      .skip(skip)
      .limit(pageSize)
      .lean();

    transactions = await populateMultiple(transactions, "user","name phoneNumber");

    const total = await Transaction.find({}).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transactions, meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Get All
 * @param {*} req
 * @param {*} res
 */
exports.allByUser = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);
    const filter = { user: req.user.id };

    const total = await Transaction.countDocuments(filter);
    const transaction = await Transaction.find(filter)
      .select(
        "-_id txRef entry user rider paymentMethod amount status createdAt"
      )
      .populate("rider", "-_id name email")
      .populate("entry", "-_id itemType description")
      .skip(skip)
      .limit(pageSize);

    // if (transaction.length < 1) return reject({ code: 404, msg: MSG_TYPES.NOT_FOUND });

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transaction, meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Get All
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res, next) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
    })
    // .populate("user")
    .populate("rider")
    .lean();

    if (!transaction) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    transaction = await populateSingle(transaction, "user","name phone");

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transaction, null);
  } catch (error) {
    next(error);
  }
};
