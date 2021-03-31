const config = require("config");
const Company = require("../models/company");
const Entry = require("../models/entry");
const Rider = require("../models/rider");
const {
  validateLocalEntry,
  validateEntryID,
  validatePickupOTP,
  validateSendRiderRequest,
  validateCalculateShipment,
} = require("../request/entry");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate, UploadFileFromLocal, UploadFileFromBinary } = require("../utils");
const CountryService = require("../services/country");
const EntryService = require("../services/entry");
const DPService = require("../services/distancePrice");
const SettingService = require("../services/setting");
const VehicleService = require("../services/vehicle");
const CompanyService = require("../services/company");
const EntrySubscription = require("../subscription/entry");
const RiderSubscription = require("../subscription/rider");
const CompanySubscription = require("../subscription/company");
const NotifyService = require("../services/notification");
const UserService = require("../services/user");
const path = require("path");
const axios = require("axios");

/**
 * Create an Entry
 * @param {*} req
 * @param {*} res
 */
exports.localEntry = async (req, res, next) => {
  try {
    const { error } = validateLocalEntry(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    req.body.company = null;
    req.body.enterprise = null;
    // we need to check if it done by an enterprise account
    if (typeof req.enterprise !== "undefined") {
      // get owners
      const company = await Company.findOne({
        state: req.body.state,
        ownership: true,
      }).select({ name: 1, rating: 1, state: 1, country: 1, logo: 1 });

      if (company) {
        req.body.company = company;
      }

      req.body.enterprise = req.enterprise._id;
    }

    const entryInstance = new EntryService();
    const countryInstance = new CountryService();
    const settingInstance = new SettingService();
    const DPInstance = new DPService();
    const VehicleInstance = new VehicleService();

    // validate state
    await countryInstance.getCountryAndState(
      req.body.country,
      req.body.state
    );

    // // validate the states
    // await countryInstance.validateState(req.body.state, req.body.delivery);

    // find a single vehicle to have access to the weight
    const vehicle = await VehicleInstance.get(req.body.vehicle);

    // check if we have pricing for the location
    const distancePrice = await DPInstance.get({
      country: req.body.country,
      state: req.body.state,
      vehicle: req.body.vehicle,
    });

    // get admin settings pricing
    const setting = await settingInstance.get({ source: "admin" });

    // get distance calculation
    const distance = await entryInstance.getDistanceMetrix(req.body);

    // check
    if (typeof req.body.img !== "undefined") {
      const images = await entryInstance.uploadArrayOfImages(req.body.img);
      req.body.img = images;
    }

    const body = await entryInstance.calculateLocalEntry(
      req.body,
      req.user,
      distance.data,
      setting,
      distancePrice,
      vehicle
    );

    // start our mongoDb transaction
    const newEntry = await entryInstance.createEntry(body);

    newEntry.metaData = null;
    // only send out a socket dispatch when it's n ot enterprise
    // because on enterprise a company has already been assigned
    if (typeof req.enterprise === "undefined") {
      const entrySub = new EntrySubscription();
      await entrySub.newEntry(newEntry._id);
    }

    JsonResponse(res, 201, MSG_TYPES.ORDER_POSTED, newEntry);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate pricing for shipment
 * @param {*} req
 * @param {*} res
 */
exports.calculateShipment = async (req, res, next) => {
  try {
    const { error } = validateCalculateShipment(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const countryInstance = new CountryService();
    const settingInstance = new SettingService();
    const DPInstance = new DPService();
    const VehicleInstance = new VehicleService();
    const country = await countryInstance.getCountryAndState(
      req.body.country,
      req.body.state
    );

    // find a single vehicle to have access to the weight
    const vehicle = await VehicleInstance.get(req.body.vehicle);

    // check if we have pricing for the location
    const distancePrice = await DPInstance.get({
      country: req.body.country,
      state: req.body.state,
      vehicle: req.body.vehicle,
    });

    // get admin settings pricing
    const setting = await settingInstance.get({ source: "admin" });

    // get distance calculation
    const distance = await entryInstance.getDistanceMetrix(req.body);

    const body = await entryInstance.calculateLocalEntry(
      req.body,
      req.user,
      distance.data,
      setting,
      distancePrice,
      vehicle
    );

    // calculate pricing based on the pickup type
    if (req.body.pickupType === "instant") {
      body.TEC = parseFloat(body.TEC) * parseFloat(body.instantPricing);
    }

    body.metaData = null;
    JsonResponse(res, 201, MSG_TYPES.ORDER_POSTED, body);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * get entries by a company
 * @param {*} req
 * @param {*} res
 */
exports.byCompany = async (req, res, next) => {
  try {
    //get pagination value
    const { page, pageSize, skip } = paginate(req);

    const company = await Company.findOne({
      _id: req.user.id,
      $or: [{ status: "active" }, { status: "inactive" }],
      verified: true,
    });
    if (!company) JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    const entries = await Entry.find({
      sourceRef: "pool",
      state: company.state,
      status: "pending",
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
    next(error);
  }
};

/**
 * Get a single entry
 * @param {*} req
 * @param {*} res
 */
exports.singleEntry = async (req, res, next) => {
  try {
    const entry = await Entry.findOne({
      _id: req.params.id,
      company: req.user.id,
    })
      .populate("orders")
      .populate("transaction")
      .populate("vehicle")
      .select("-metaData");

    if (!entry) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, entry);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Company accept Entry
 * @param {*} req
 * @param {*} res
 */
exports.companyAcceptEntry = async (req, res, next) => {
  try {
    const entryInstance = new EntryService();
    const entry = await entryInstance.companyAcceptEntry(req.params, req.user);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry._id);

    // dispatch accepted entry to companies
    const companySub = new CompanySubscription();
    await companySub.dispatchAcceptedEntry(entry._id);

    JsonResponse(res, 200, MSG_TYPES.COMPANY_ACCEPT);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a rider to a order accepted by the company
 * @param {*} req
 * @param {*} res
 */
exports.riderAssignToEntry = async (req, res, next) => {
  try {
    const { error } = validateSendRiderRequest(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    // find the company
    const companyInstance = new CompanyService();
    const company = await companyInstance.get({
      _id: req.user.id,
      status: "active",
      verified: true,
    });

    const entryInstance = new EntryService();
    const { entry, riderIDS } = await entryInstance.riderAsignEntry(
      req.body,
      company._id
    );

    // send entries to all the rider
    const riderSub = new RiderSubscription();
    await riderSub.sendRidersEntries(riderIDS, entry);


    JsonResponse(res, 200, MSG_TYPES.RIDER_ASSIGN);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Rider Accept entry
 * @param {*} req
 * @param {*} res
 */
exports.riderAcceptEntry = async (req, res, next) => {
  try {
    const { error } = validateEntryID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const { entry, rider } = await entryInstance.riderAcceptEntry(
      req.body,
      req.user
    );

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry);

    // dispatch action to riders for taken entry
    const riderSub = new RiderSubscription();
    await riderSub.takenEntryForRiders(entry._id);

    // send nofication to the rider device
    const title = "New Order Alert!!!!";
    const notifyInstance = new NotifyService();
    await notifyInstance.textNotify(title, "", rider.FCMToken);

    JsonResponse(res, 200, MSG_TYPES.RIDER_ACCEPTED);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Rider Reject entry
 * @param {*} req
 * @param {*} res
 */
exports.riderRejectEntry = async (req, res, next) => {
  try {
    const { error } = validateEntryID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    await entryInstance.riderRejectEntry(req.body, req.user);

    JsonResponse(res, 200, MSG_TYPES.RIDER_REJECTED);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Start Pickup trigger by rider
 * @param {*} req
 * @param {*} res
 */
exports.riderStartPickup = async (req, res, next) => {
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

    const userInstance = new UserService();
    const user = await userInstance.get(
      { _id: entry.user },
      {
        FCMToken: 1,
      }
    );

    // send nofication to the user device
    const title = "Driver is on his way to the pickup location";
    const notifyInstance = new NotifyService();
    await notifyInstance.textNotify(title, "", user.FCMToken);

    JsonResponse(res, 200, MSG_TYPES.PROCEED_TO_PICKUP);
    return;
  } catch (error) {
    console.log("error controller", error);
    next(error);
  }
};

/**
 * Rider Arrive a pickup location
 * @param {*} req
 * @param {*} res
 */
exports.riderArriveAtPickup = async (req, res, next) => {
  try {
    const { error } = validateEntryID(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const { entry, user } = await entryInstance.riderArriveAtPickup(
      req.body,
      req.user
    );

    // send fcm notification
    // send nofication to the user device
     const title = "Driver has arrived at the pickup location";
     const notifyInstance = new NotifyService();
     await notifyInstance.textNotify(title, "", user.FCMToken);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry);

    JsonResponse(res, 200, MSG_TYPES.ARRIVED_AT_PICKUP);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Driver Confirm OTP code for pickup
 * @param {*} req
 * @param {*} res
 */
exports.riderComfirmPickupOTPCode = async (req, res, next) => {
  try {
    const { error } = validatePickupOTP(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const entryInstance = new EntryService();
    const { entry, user } = await entryInstance.riderComfirmPickupOTPCode(
      req.body,
      req.user
    );

    // send fcm notification
    // send nofication to the user device
    const title = "Driver has confirmed Pickup.";
    const notifyInstance = new NotifyService();
    await notifyInstance.textNotify(title, "", user.FCMToken);

    // send socket to admin for update
    const entrySub = new EntrySubscription();
    await entrySub.updateEntryAdmin(entry);

    JsonResponse(res, 200, MSG_TYPES.PICKED_UP);
    return;
  } catch (error) {
    next(error);
  }
};


exports.validateAddressBook = async (req, res, next) => {
  try{
    const dataFile = req?.files?.addresses;
    if(!dataFile){
      return res.status(400).send({msg: "Addresses file not uploaded"});
    };

    const s3Upload = await UploadFileFromBinary(dataFile.data, dataFile.name);

    const response = await axios.post(config.get("lambdas.addressBookValidation"), {
      addresses: s3Upload.Key
    });

    if(response && response.data){
      return res.send({data: response.data.data, msg: "Data validated successfully"});
    }

  } catch(error){
    next(error);
  }
}
