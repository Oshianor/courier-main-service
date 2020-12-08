const moment = require("moment");
const Company = require("../models/company");
const Rider = require("../models/rider");
const OnlineHistory = require("../models/onlineHistory");
const Country = require("../models/countries");
const Entry = require("../models/entry");
const RiderCompanyRequest = require("../models/riderCompanyRequest");
const CountryService = require("../services/country");
const RiderService = require("../services/rider");
const CompanyService = require("../services/company");
const { validateStatusUpdate } = require("../models/riderCompanyRequest");
const { validateRider, validateRiderSelf, validateRiderFCMToken } = require("../request/rider");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../utils");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { Verification } = require("../templates");

/**
 * Create Rider
 * @param {*} req
 * @param {*} res
 */
exports.create = async (req, res) => {
  try {
    const { error } = validateRider(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

      const countryInstance = new CountryService();
      const country = await countryInstance.getCountryAndState(
        req.body.country,
        req.body.state
      );
      // add country code.
      req.body.countryCode = country.cc;


      const companyInstance = new CompanyService();
      const company = await companyInstance.get({
        _id: req.user.id,
        verified: true,
        status: "active",
      });
      req.body.company = req.user.id;
      req.body.createdBy = "company";
      const riderInstance = new RiderService();
      const rider = await riderInstance.create(req.body, req.files);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, rider);
  } catch (error) {
    console.log(error);
    JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Create Rider (Self)
 * @param {*} req
 * @param {*} res
 */
exports.createSelf = async (req, res) => {
  try {
    const { error } = validateRiderSelf(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const countryInstance = new CountryService();
    const country = await countryInstance.getCountryAndState(
      req.body.country,
      req.body.state
    );

    const companyInstance = new CompanyService();
    const company = await companyInstance.get({
      _id: req.body.company,
      verified: true,
      status: "active",
    });

    // add country code.
    req.body.countryCode = country.cc;
    req.body.createdBy = "self";
    req.body.company = null;
    const riderInstance = new RiderService();
    const rider = await riderInstance.create(req.body, req.files);
    await riderInstance.sendCompanyRequest(company._id, rider._id);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, rider);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Get Me
 * @param {*} req
 * @param {*} res
 */
exports.me = async (req, res) => {
  try {
    const rider = await Rider.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    })
      .populate("vehicle")
      .select("-password");
    if (!rider) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    if (!rider.company)
      return JsonResponse(res, 404, "Company Not Found!");

    const company = await Company.findOne({
      _id: rider.company,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found!");

    JsonResponse(res, 200, MSG_TYPES.FETCHED, rider);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Get One Rider
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!");
      return;
    }
    const riderId = req.params.riderId;
    const rider = await Rider.findOne({ _id: riderId })
      .populate("company")
      .select("-password");

    if (!rider) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      return;
    }

    JsonResponse(res, 200, null, rider);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Get All Riders by a company
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const company = await Company.findOne({ _id: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!");
      return;
    }

    const riders = await Rider.find({ company: company.id, deleted: false })
      .skip(skip)
      .limit(pageSize)
      .populate("company", "name address state country logo")
      .select("-password -rememberToken");
    const total = await Rider.find({
      company: company.id,
      deleted: false,
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, riders, meta);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Get All Riders by Admin
 * @param {*} req
 * @param {*} res
 */
exports.allByAdmin = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const riders = await Rider.find()
      .skip(skip)
      .limit(pageSize)
      .populate("company", "name address state country logo")
      .select("-password -rememberToken");
    const total = await Rider.find().countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, riders, meta);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Get All Riders Request
 * @param {*} req
 * @param {*} res
 */
exports.requests = async (req, res) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const riders = await RiderCompanyRequest.find({
      status: "pending",
      company: req.user.id,
    })
      .populate("rider", "name email address state country img onlineStatus")
      .populate("company", "name email address state country logo")
      .skip(skip)
      .limit(pageSize)
      .select("-password");
    const total = await Rider.find({
      companyRequest: "pending",
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, riders, meta);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Go online/offline
 * @param {*} req
 * @param {*} res
 */
exports.updateSingle = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.user.companyId,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND);

    const rider = await Rider.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    });
    if (!rider) return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND);

    JsonResponse(res, 200, MSG_TYPES.UPDATED, rider);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Respond to Riders Request
 * @param {*} req
 * @param {*} res
 */
exports.respond = async (req, res) => {
  try {
    const { error } = validateStatusUpdate(req.body);
    if (error) {
      return JsonResponse(res, 400, error.details[0].message);
    }
    const request = await RiderCompanyRequest.findOne({
      _id: req.params.requestId,
    });
    if (!request)
      return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND);

    const rider = await Rider.findOne({ _id: request.rider });

    if (req.body.status === "approved") {
      rider.company = request.company;
      await rider.save();
    }

    request.status = req.body.status;

    await request.save();

    JsonResponse(res, 200, MSG_TYPES.UPDATED, request);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Suspend rider account by Admin
 * @param {*} req
 * @param {*} res
 */
exports.status = async (req, res) => {
  try {
    const { error } = validateRiderStatus(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const rider = await Rider.findOne({ _id: req.params.rider });
    if (!rider) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    await rider.updateOne({ status: req.body.status });

    JsonResponse(res, 200, `Rider account ${req.body.status}`);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * SRider goline and offline
 * @param {*} req
 * @param {*} res
 */
exports.online = async (req, res) => {
  try {
    const rider = await Rider.findOne({
      _id: req.user.id,
      status: "active",
      verified: true,
    });
    if (!rider) return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, rider);

    let msg;
    if (rider.onlineStatus) {
      // to disable a rider account we need to know if they
      const entry = await Entry.findOne({
        rider: req.user.id,
        $or: [
          { status: "driverAccepted" },
          { status: "enrouteToPickup" },
          { status: "arrivedAtPickup" },
          { status: "pickedup" },
          { status: "enrouteToDelivery" },
          { status: "arrivedAtDelivery" },
          { status: "delivered" },
        ],
      });

      if (entry) return JsonResponse(res, 200, "You can't go offline while on a trip.");

      msg = "Offline Successfully ";
      await rider.updateOne({ onlineStatus: false });
      const newOnelineHistory = new OnlineHistory({
        rider: req.user.id,
        status: "offline",
      });
      await newOnelineHistory.save()
    } else {
      msg = "Online Successfully ";
      await rider.updateOne({ onlineStatus: true });
      const newOnelineHistory = new OnlineHistory({
        rider: req.user.id,
        status: "online",
      });
      await newOnelineHistory.save();
    }

    JsonResponse(res, 200, msg);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Update rider location
 * @param {*} req
 * @param {*} res
 */
exports.location = async (req, res) => {
  try {
    const { error } = validateRiderLocation(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    await Rider.updateOne({ _id: req.user.id }, req.body)

    JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Delete One Rider
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const riderInstance = new RiderService();
    await riderInstance.destory(req.params, req.user);

    JsonResponse(res, 200, MSG_TYPES.DELETED);
  } catch (error) {
    console.log(error);
    JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Update rider FCMToken from firebase controller
 * @param {*} req
 * @param {*} res
 */
exports.FCMToken = async (req, res) => {
  try {
    const { error } = validateRiderFCMToken(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const riderInstance = new RiderService()
    await riderInstance.updateFCMToken(req.body, req.user);

    JsonResponse(res, 200, MSG_TYPES.FCMToken);
    return
  } catch (error) {
    JsonResponse(res, error.code, error.msg);
    return
  }
}

/**
 * Get rider accepted order list
 * @param {*} req
 * @param {*} res
 */
exports.basket = async (req, res) => {
  try {
    const riderInstance = new RiderService()
    const orders = await riderInstance.getRiderBasket(req.user);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders);
    return
  } catch (error) {
    JsonResponse(res, error.code, error.msg);
    return
  }
}


/**
 * Get rider completed order for the day
 * @param {*} req
 * @param {*} res
 */
exports.completedOrder = async (req, res) => {
  try {
    const riderInstance = new RiderService()
    const orders = await riderInstance.getRiderDeliveredBasket(req.user);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders);
    return
  } catch (error) {
    JsonResponse(res, error.code, error.msg);
    return
  }
}

/**
 * Get rider's trips in the current month
 * @param {*} req
 * @param {*} res
 */
exports.trips = async (req, res) => {
  try {
    const riderInstance = new RiderService()
    const trips = await riderInstance.getRiderTrips(req.user);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, trips);
    return
  } catch (error) {
    JsonResponse(res, error.code, error.msg);
    return
  }
}