const config = require("config");
const io = require("socket.io-emitter");
const Company = require("../models/company");
const Entry = require("../models/entry");
const Rider = require("../models/rider");
const Transaction = require("../models/transaction");
const { Container } = require("typedi");
const {
  validateTransaction,
  validateTransactionStatus,
} = require("../request/transaction");
const { validateLocalEntry, validateEntryID } = require("../request/entry");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { SERVER_EVENTS } = require("../constant/events");
const { paginate } = require("../utils");
const CountryService = require("../services/country");
const EntryService = require("../services/entry");
const DPService = require("../services/distancePrice");
const SettingService = require("../services/setting");
const EntrySubscription = require("../subscription/entry");
const socket = new io(config.get("application.redis"), { key: "/sio" })
const DPInstance = Container.get(DPService);
const settingInstance = Container.get(SettingService);
const countryInstance = Container.get(CountryService);
const entryInstance = Container.get(EntryService);



/**
 * Create an Entry
 * @param {*} req
 * @param {*} res
 */
exports.localEntry = async (req, res) => {
  try {
    const { error } = validateLocalEntry(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

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
 * Rider confirm user cash payment
 * @param {*} req
 * @param {*} res
 */
exports.riderConfirmPayment = async (req, res) => {
  try {
    const { error } = validateTransactionStatus(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    // find the rider
    const rider = await Rider.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
      company: { $ne: null },
    });
    if (!rider) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    // find the company
    const company = await Company.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    const entry = await Entry.findOne({
      status: "accepted",
      rider: rider._id,
      company: company._id,
    });
    if (!entry) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    const trans = await Transaction.findOne({
      entry: entry._id,
    });
    if (!trans) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    let msgRES;
    if (req.body.status === "approved") {
      await trans.updateOne({ status: "approved", approvedAt: new Date() });
      msgRES = "Payment Approved.";
    } else {
      await trans.updateOne({ status: "declined", approvedAt: new Date() });
      await entry.updateOne({ status: "cancelled", cancelledAt: new Date() });
      msgRES = "Payment Declined and Order cancelled.";
    }

    JsonResponse(res, 200, msgRES);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
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