const moment = require("moment");
const bcrypt = require("bcrypt");
const service = require("../services");
const { Company } = require("../models/company");
const {
  Rider,
  validateRider,
  validateRiderSelf,
} = require("../models/rider");
const { Country } = require("../models/countries");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { Verification } = require("../templates");
const {
  UploadFileFromBinary,
  Mailer,
  GenerateToken,
  GenerateOTP,
} = require("../utils");
const {
  RiderCompanyRequest,
  validateStatusUpdate,
} = require("../models/riderCompanyRequest");
const { OnlineHistory } = require("../models/onlineHistory");
const { Entry } = require("../models/entry");


/**
 * Create Rider
 * @param {*} req
 * @param {*} res
 */
exports.create = async (req, res) => {
  try {
    const { error } = validateRider(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const company = await Company.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    const rider = await Rider.findOne({ email: req.body.email });
    if (rider)
      return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);

    const phoneCheck = await Rider.findOne({
      phoneNumber: req.body.phoneNumber,
    });
    if (phoneCheck) {
      JsonResponse(res, 400, `\"phoneNumber"\ already exists!`, null, null);
      return;
    }

    // validate country
    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    if (req.files.POI) {
      const POI = await UploadFileFromBinary(
        req.files.POI.data,
        req.files.POI.name
      );
      req.body.POI = POI.Key;
    }

    if (req.files.img) {
      const img = await UploadFileFromBinary(
        req.files.img.data,
        req.files.img.name
      );
      req.body.img = img.Key;
    }

    const token = GenerateToken(225);
    req.body.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };

    req.body.company = req.user.id;
    req.body.countryCode = country.cc; // add country code.
    req.body.createdBy = "company";
    // req.body.verificationType = "email";
    req.body.companyRequest = "approved";
    await Rider.create(req.body);

    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email, "rider");
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    const company = await Company.findOne({
      _id: req.body.company,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    const rider = await Rider.findOne({ email: req.body.email });
    if (rider)
      return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);

    const phoneCheck = await Rider.findOne({
      phoneNumber: req.body.phoneNumber,
    });
    if (phoneCheck) {
      JsonResponse(res, 400, `\"phoneNumber"\ already exists!`, null, null);
      return;
    }

    // validate country
    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

    // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined")
      return JsonResponse(res, 404, "State Not Found", null, null);

    if (req.files.POI) {
      const POI = await UploadFileFromBinary(
        req.files.POI.data,
        req.files.POI.name
      );
      req.body.POI = POI.Key;
    }

    if (req.files.img) {
      const img = await UploadFileFromBinary(
        req.files.img.data,
        req.files.img.name
      );
      req.body.img = img.Key;
    }

    const token = GenerateToken(225);
    req.body.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };

    // const password = await bcrypt.hash(req.body.password, 10);
    // req.body.password = password;
    req.body.countryCode = country.cc; // add country code.
    req.body.createdBy = "self";
    req.body.company = null;
    const newRider = new Rider(req.body);

    const request = new RiderCompanyRequest({
      company: company.id,
      rider: newRider._id,
      status: "pending",
    });
    await request.save();
    await newRider.save();

    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email, "rider");
    Mailer(req.body.email, subject, html);
    newRider.rememberToken = null;
    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, newRider, null);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
    if (!rider) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    if (!rider.company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    const company = await Company.findOne({
      _id: rider.company,
      verified: true,
      status: "active",
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }
    const riderId = req.params.riderId;
    const rider = await Rider.findOne({ _id: riderId })
      .populate("company")
      .select("-password");

    if (!rider) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, null, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
      JsonResponse(res, 404, "Company Not Found!", null, null);
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
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
      return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, null, null);

    const rider = await Rider.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    });
    if (!rider) return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, null, null);

    JsonResponse(res, 200, MSG_TYPES.UPDATED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }
    const request = await RiderCompanyRequest.findOne({
      _id: req.params.requestId,
    });
    if (!request)
      return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, null, null);

    const rider = await Rider.findOne({ _id: request.rider });

    if (req.body.status === "approved") {
      rider.company = request.company;
      await rider.save();
    }

    request.status = req.body.status;

    await request.save();

    JsonResponse(res, 200, MSG_TYPES.UPDATED, request, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // // to disable a rider account we need to know if they
    // const entry = await Entry.findOne({
    //   $or: [
    //     { status: "ongoing", rider: req.params.rider },
    //     { status: "driverAccepted", rider: req.params.rider },
    //   ],
    // });

    // if (entry) return JsonResponse(res, 200, "This rider is currently on a trip", null, null);

    const rider = await Rider.findOne({ _id: req.params.rider });
    if (!rider) return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, rider, null);

    await rider.updateOne({ status: req.body.status });

    JsonResponse(res, 200, `Rider account ${req.body.status}`, null, null);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
    if (!rider) return JsonResponse(res, 200, MSG_TYPES.NOT_FOUND, rider, null);

    let msg;
    if (rider.onlineStatus) {
      // to disable a rider account we need to know if they
      const entry = await Entry.findOne({
        $or: [
          { status: "ongoing", rider: req.user.id },
          { status: "driverAccepted", rider: req.user.id },
        ],
      });

      if (entry) return JsonResponse(res, 200, "You can't go offline while on a trip.", null, null);

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

    JsonResponse(res, 200, msg, null, null);
    return
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
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
    if (error) return JsonResponse(res, 400, error.details[0].message, null, null);
      
    await Rider.updateOne({ _id: req.user.id }, req.body)

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Delete One Rider
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const riderId = req.params.riderId;
    const rider = await Rider.findOne({ _id: riderId });

    if (!rider) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    rider.deletedBy = req.user.id;
    rider.deleted = true;
    rider.deletedAt = Date.now();
    await rider.save();
    JsonResponse(res, 200, MSG_TYPES.DELETED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
