const config = require("config");
const io = require("socket.io-emitter");
const Company = require("../models/company");
const Entry = require("../models/entry");
const Rider = require("../models/rider");
const Transaction = require("../models/transaction");
const {
  validateTransaction,
  validateTransactionStatus,
} = require("../request/transaction");
const {
  validateLocalEntry,
  validateEntryID,
  validatePickupOTP,
} = require("../request/entry");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { SERVER_EVENTS } = require("../constant/events");
const { paginate } = require("../utils");
const CountryService = require("../services/country");
const EntryService = require("../services/entry");
const DPService = require("../services/distancePrice");
const SettingService = require("../services/setting");
const EntrySubscription = require("../subscription/entry");
const NotifyService = require("../services/notification");
const UserService = require("../services/user")
const socket = new io(config.get("application.redis"), { key: "/sio" })



/**
 * Create an Entry
 * @param {*} req
 * @param {*} res
 */
exports.localEntry = async (req, res) => {
  try {
    const { error } = validateLocalEntry(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const countryInstance = new CountryService();
    const settingInstance = new SettingService();
    const DPInstance = new DPService();
    const country = await countryInstance.getCountryAndState(
      req.body.country,
      req.body.state
    );
    

    // check if we have pricing for the location
    const distancePrice = await DPInstance.get({country: req.body.country,state: req.body.state,vehicle: req.body.vehicle});

    // get admin settings pricing
    const setting = await settingInstance.get({ source: "admin" });
 
    // get distance calculation
    const distance = await entryInstance.getDistanceMetrix(req.body);

    const body = await entryInstance.calculateLocalEntry(
      req.body,
      req.user,
      distance.data,
      setting,
      distancePrice
    );
    
    // start our mongoDb transaction
    const newEntry = await entryInstance.createEntry(body)

    newEntry.metaData = null;
    const entrySub = new EntrySubscription();
    await entrySub.newEntry(newEntry._id);
    JsonResponse(res, 201, MSG_TYPES.ORDER_POSTED, newEntry);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * User confirm payment method and entry
 * @param {*} req
 * @param {*} res
 */
exports.transaction = async (req, res) => {
  try {
    const { error } = validateTransaction(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const { entry, msg } = await entryInstance.createTransaction(req.body, req.user, req.token);

    socket.emit(SERVER_EVENTS.NEW_ENTRY, entry);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 201, msg);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * get entries by a company
 * @param {*} req
 * @param {*} res
 */
exports.byCompany = async (req, res) => {
  try {
    //get pagination value
    const { page, pageSize, skip } = paginate(req);

    const company = await Company.findOne({ _id: req.user.id, $or: [{ status: "active" }, { status: "inactive" }], verified: true });
    if (!company) JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    const entries = await Entry.find({
      sourceRef: "pool",
      state: company.state,
      status: "pending"
      // company: null
    })
      .skip(skip)
      .limit(pageSize)
      .select("-metaData");

    const total = await Entry.find({
      sourceRef: "pool",
      status: "pending",
      state: company.state,
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, entries, meta);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
    return;
  }
};

/**
 * Get a single entry
 * @param {*} req
 * @param {*} res
 */
exports.singleEntry = async (req, res) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id })
      .populate("orders")
      .select("-metaData");

    if (!entry) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, entry, null);
    return;
  } catch (error) {
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
    return;
  }
};

/**
 * Get all online riders for a company by an entry
 * @param {*} req
 * @param {*} res
 */
exports.allOnlineRiderCompanyEntry = async (req, res) => {
  try {

    // find an entry that as been assigned to the company
    const entry = await Entry.findOne({
      _id: req.params.entry,
      status: "companyAccepted",
      company: req.user.id
    });
    if (!entry) return JsonResponse(res, 404, "Entry Not Found!");

    const company = await Company.findOne({
      _id: req.user.id,
      $or: [{ status: "active" }, { status: "inactive" }],
      verified: true,
    });
    if (!company) return JsonResponse(res, 404, "Company Not Found!");

    console.log("entry.vehicle", entry.vehicle);
    console.log("company._id", company._id);
    const riders = await Rider.find({
      company: company._id,
      deleted: false,
      onlineStatus: true,
      status: "active",
      verified: true,
      vehicle: entry.vehicle,
    })
      .populate("vehicle")
      .select("name email phoneNumber state country vehicle");


    JsonResponse(res, 200, MSG_TYPES.FETCHED, riders, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Company accept Entry
 * @param {*} req
 * @param {*} res
 */
exports.companyAcceptEntry = async (req, res) => {
  try {

    const entryInstance = new EntryService();
    const entry = await entryInstance.companyAcceptEntry(req.params, req.user)

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 200, MSG_TYPES.COMPANY_ACCEPT);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Assign a rider to a order accepted by the company
 * @param {*} req 
 * @param {*} res 
 */
exports.riderAssignToEntry = async (req, res) => {
  try {
    const { error } = validateEntryID(req.params);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const entry = await entryInstance.riderAsignEntry(req.body, req.params, req.user);

    // send to rider by their room id
    // send socket to riders only
    socket.to(String(req.body.rider)).emit(SERVER_EVENTS.ASSIGN_ENTRY, entry);

    JsonResponse(res, 200, MSG_TYPES.RIDER_ASSIGN);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};


/**
 * Rider Accept entry
 * @param {*} req 
 * @param {*} res 
 */
exports.riderAcceptEntry = async (req, res) => {
  try {
    const { error } = validateEntryID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const entry = await entryInstance.riderAcceptEntry(req.body, req.user);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 200, MSG_TYPES.RIDER_ACCEPTED);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};


/**
 * Rider Reject entry
 * @param {*} req 
 * @param {*} res 
 */
exports.riderRejectEntry = async (req, res) => {
  try {
    const { error } = validateEntryID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    await entryInstance.riderRejectEntry(req.body, req.user);

    JsonResponse(res, 200, MSG_TYPES.RIDER_REJECTED);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};


/**
 * Start Pickup trigger by rider
 * @param {*} req 
 * @param {*} res 
 */
exports.riderStartPickup = async (req, res) => {
  try {
    const { error } = validateEntryID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
     const { entry } = await entryInstance.riderStartEntryPickup(
       req.body,
       req.user
     );

    // send socket to admin for update
    const entrySub = new EntrySubscription();
   await entrySub.updateEntryAdmin(req.body.entry);

    // send nofication to the user device
    const title = "Driver is on his way to the pickup location";
    const notifyInstance = new NotifyService();
    notifyInstance.textNotify(title, "", entry.user.FCMToken);

    JsonResponse(res, 200, MSG_TYPES.PROCEED_TO_PICKUP);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};


/**
 * Rider Arrive a pickup location
 * @param {*} req 
 * @param {*} res 
 */
exports.riderArriveAtPickup = async (req, res) => {
  try {
    const { error } = validateEntryID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const {entry} = await entryInstance.riderArriveAtPickup(req.body, req.user);

    // send fcm notification
    // send nofication to the user device
    const title = "Driver has arrived at the pickup location";
    const notifyInstance = new NotifyService();
    notifyInstance.textNotify(title, "", entry.user.FCMToken);

    
    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(req.body.entry);

    JsonResponse(res, 200, MSG_TYPES.ARRIVED_AT_PICKUP);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
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
      notifyInstance.textNotify(title, "", entry.user.FCMToken);

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
 * Driver Confirm OTP code for pickup
 * @param {*} req 
 * @param {*} res 
 */
exports.riderComfirmPickupOTPCode = async (req, res) => {
  try {
    const { error } = validatePickupOTP(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const { entry } = await entryInstance.riderComfirmPickupOTPCode(
      req.body,
      req.user
    );

    // send fcm notification
    // send nofication to the user device
    const title = "Driver has confirmed Pickup.";
    const notifyInstance = new NotifyService();
    notifyInstance.textNotify(title, "", entry.user.FCMToken);

    
    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    JsonResponse(res, 200, MSG_TYPES.PICKED_UP);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};

