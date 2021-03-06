const moment = require("moment");
const Company = require("../models/company");
const Rider = require("../models/rider");
const RiderCompanyRequest = require("../models/riderCompanyRequest");
const CountryService = require("../services/country");
const RiderService = require("../services/rider");
const CompanyService = require("../services/company");
const { validateStatusUpdate } = require("../request/riderCompanyRequest");
const {
  validateRider,
  validateRiderSelf,
  validateRiderFCMToken,
  validateRiderLocation,
  validateRiderStatus,
  validateEarningStatistics
} = require("../request/rider");
const { paginate } = require("../utils");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const OrderService = require("../services/order");

/**
 * Create Rider
 * @param {*} req
 * @param {*} res
 */
exports.create = async (req, res, next) => {
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
    next(error)
  }
};

/**
 * Create Rider (Self)
 * @param {*} req
 * @param {*} res
 */
exports.createSelf = async (req, res, next) => {
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
      verified: true,
      status: "active",
      ownership: true
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
    next(error)
  }
};

/**
 * Get Me
 * @param {*} req
 * @param {*} res
 */
exports.me = async (req, res, next) => {
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
    next(error)
  }
};

/**
 * Get One Rider
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res, next) => {
  try {
    const company = await Company.findOne({ _id: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!");
      return;
    }
    const riderInstance = new RiderService();

    const rider = await riderInstance.getRider(req.params.riderId);

    JsonResponse(res, 200, null, rider);
  } catch (error) {
    console.log(error);
    next(error)
  }
};

/**
 * Get All Riders by a company
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res, next) => {
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
    next(error)
  }
};

/**
 * Get All Riders by Admin
 * @param {*} req
 * @param {*} res
 */
exports.allByAdmin = async (req, res, next) => {
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
    next(error)
  }
};

/**
 * Get All Riders Request
 * @param {*} req
 * @param {*} res
 */
exports.requests = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const riders = await RiderCompanyRequest.find({
      status: "pending",
      company: req.user.id,
    })
      .populate("rider", "-password")
      // .populate("company", "name email address state country logo")
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
    next(error)
  }
};

/**
 * Go online/offline
 * @param {*} req
 * @param {*} res
 */
exports.updateSingle = async (req, res, next) => {
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
    next(error)
  }
};

/**
 * Respond to Riders Request
 * @param {*} req
 * @param {*} res
 */
exports.respond = async (req, res, next) => {
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
    next(error)
  }
};

/**
 * Suspend rider account by Admin
 * @param {*} req
 * @param {*} res
 */
exports.status = async (req, res, next) => {
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
    next(error)
  }
};

/**
 * Rider go online and offline
 * @param {*} req
 * @param {*} res
 */
exports.online = async (req, res, next) => {
  try {
    const { error } = validateRiderLocation(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const riderInstance = new RiderService();
    const { msg } = await riderInstance.toggleOnlineStatus(req.body, req.user);

    JsonResponse(res, 200, msg);
    return
  } catch (error) {
    next(error)
  }
};

/**
 * Update rider location
 * @param {*} req
 * @param {*} res
 */
exports.location = async (req, res, next) => {
  try {
    const { error } = validateRiderLocation(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    req.body.locationDate = new Date();
    await Rider.updateOne({ _id: req.user.id }, req.body)

    JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    console.log(error);
    next(error)
  }
};

/**
 * Delete One Rider
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res, next) => {
  try {
    const riderInstance = new RiderService();
    await riderInstance.destroy(req.params, req.user);

    JsonResponse(res, 200, MSG_TYPES.DELETED);
  } catch (error) {
    console.log(error);
    next(error)
  }
};

/**
 * Update rider FCMToken from firebase controller
 * @param {*} req
 * @param {*} res
 */
exports.FCMToken = async (req, res, next) => {
  try {
    const { error } = validateRiderFCMToken(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const riderInstance = new RiderService()
    await riderInstance.updateFCMToken(req.body, req.user);

    JsonResponse(res, 200, MSG_TYPES.FCMToken);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * Get rider accepted order list
 * @param {*} req
 * @param {*} res
 */
exports.basket = async (req, res, next) => {
  try {
    const riderInstance = new RiderService()
    const orders = await riderInstance.getRiderBasket(req.user);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * Get rider completed order for the day
 * @param {*} req
 * @param {*} res
 */
exports.completedOrder = async (req, res, next) => {
  try {
    const riderInstance = new RiderService()
    const orders = await riderInstance.getRiderDeliveredBasket(req.user);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * Get rider's trips in the current month
 * @param {*} req
 * @param {*} res
 */
exports.trips = async (req, res, next) => {
  try {
    const riderInstance = new RiderService()
    const trips = await riderInstance.getRiderTrips(req.user);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, trips);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * Get rider's transaction for the month
 * @param {*} req
 * @param {*} res
 */
exports.getTransaction = async (req, res, next) => {
  try {
    const riderInstance = new RiderService()
    const { transaction } = await riderInstance.getRiderTransaction(req.user);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transaction);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * Get rider's trip status by admin
 * @param {*} req
 * @param {*} res
 */
exports.checkDriverTripStatus = async (req, res, next) => {
  try {
    const riderInstance = new RiderService()
    const { order } = await riderInstance.getDriverTripStatus(
      req.params.riderId
    );

    const withPackage = order ? true : false;

    JsonResponse(res, 200, MSG_TYPES.FETCHED, { withPackage });
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * Suspend a rider
 * @param {*} req
 * @param {*} res
 */
exports.suspend = async (req, res, next) => {
  try {
    const riderInstance = new RiderService()
    const updatedRider = await riderInstance.changeRiderStatus(req.params.riderId, req.user.id, "suspended");

    JsonResponse(res, 200, MSG_TYPES.UPDATED);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * Unsuspend a rider
 * @param {*} req
 * @param {*} res
 */
exports.unsuspend = async (req, res, next) => {
  try {
    const riderInstance = new RiderService()
    const updatedRider = await riderInstance.changeRiderStatus(req.params.riderId, req.user.id, "active");

    JsonResponse(res, 200, MSG_TYPES.UPDATED);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * GET a rider's transactions
 * @param {*} req
 * @param {*} res
 */
exports.getRiderTransactions = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const riderInstance = new RiderService()
    const { transactions, total } = await riderInstance.getTransactions({
      company: req.user.id,
      rider: req.params.riderId
    }, skip, pageSize);

    const meta = {
      total,
      pagination: { pageSize, page }
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transactions, meta);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * GET a rider's orders
 * @param {*} req
 * @param {*} res
 */
exports.getRiderOrders = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const riderInstance = new RiderService()
    const { orders, total } = await riderInstance.getOrders({
      rider: req.params.riderId,
      company: req.user.id
    }, skip, pageSize);

    const meta = {
      total,
      pagination: { pageSize, page }
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders, meta);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * GET a rider's statistics
 * @param {*} req
 * @param {*} res
 */
exports.getRiderStatistics = async (req, res, next) => {
  try {
    const companyInstance = new CompanyService()
    const transactions = await companyInstance.getRiderStatistics(req.user.id, {rider: req.params.riderId});

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transactions);
    return
  } catch (error) {
    next(error)
    return
  }
}

/**
 * GET Rider order earning statistics
 * @param {*} req
 * @param {*} res
 */

exports.getEarningStatistics = async (req, res, next) => {
  try {
    const { error } = validateEarningStatistics(req.query);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const riderInstance = new RiderService()
    const data = await riderInstance.getEarningStatistics(req.user.id, req.query.date);

    return JsonResponse(res, 200, MSG_TYPES.FETCHED, data);
  } catch (error) {
    console.log(error)
    next(error)
  }
}

exports.removeOrderFromBasket = async (req, res, next) => {
  try {
    const orderInstance = new OrderService();
    await orderInstance.removeOrderFromRiderBasket(req.user.id, req.params.orderId);

    return JsonResponse(res, 200, "Order cancelled successfully");
  } catch (error) {
    next(error)
  }
}