const moment = require("moment");
const Company = require("../models/company");
const Organization = require("../models/organization");
const Pricing = require("../models/pricing");
const Setting = require("../models/settings");
const Country = require("../models/countries");
const CountryService = require("../services/country");
const SubscriptionService = require("../services/subscription");
const PricingService = require("../services/pricing");
const VehicleService = require("../services/vehicle");
const CompanyService = require("../services/company");
const StatisticsService = require("../services/statistics");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { nanoid } = require("nanoid");
const Verification = require("../templates/verification");
const {
  validateUpdateCompany,
  validateStatusUpdate,
  validateCompanyVerification,
  validateCompany,
  validateChangePassword
} = require("../request/company");
const {
  UploadFileFromBinary,
  Mailer,
  GenerateToken,
  paginate,
} = require("../utils");
const countryInstance = new CountryService();
const vehicleInstance = new VehicleService();
const companyInstance = new CompanyService();
const statisticsInstance = new StatisticsService();

/**
 * Create Company
 * @param {*} req
 * @param {*} res
 */
exports.company = async (req, res, next) => {
  try {
    req.body.vehicles = req.body.vehicles.split(",");
    const { error } = validateCompany(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    // validate country service
    const country = await countryInstance.getCountryAndState(req.body.country, req.body.state);
    req.body.countryCode = country.cc;

    // validate the array for supported vehicle list
    await vehicleInstance.validateAllVehiclesFromList(req.body.vehicles);
    const pricingInstance = new PricingService();
    const freemiumPlan = await pricingInstance.getPricing({ type: "freemium" })
    req.body.tier = freemiumPlan._id;

    const { company, organization } = await companyInstance.create(req.body, req.files);
    const subscriptionInstance = new SubscriptionService();


    const startDate = new Date();
    const duration = 30;
    var endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const subObject = {
      company: company._id,
      pricing: freemiumPlan._id,
      startDate,
      duration,
      endDate
    }
    await subscriptionInstance.create(subObject)
    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, company);
    return;
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Create Company branch
 * @param {*} req
 * @param {*} res
 */
exports.branch = async (req, res, next) => {
  try {

    return;
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get me
 * @param {*} req
 * @param {*} res
 */
exports.me = async (req, res, next) => {
  try {
    const company = await Company.findOne({
      _id: req.user.id,
      verified: true,
      status: "active",
    })
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority");

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, company, null);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get One Company by Admin
 * @param {*} req
 * @param {*} res
 */
exports.single = async (req, res, next) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId })
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority");

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, company, null);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get All Companies by Admin
 * @param {*} req
 * @param {*} res
 */
exports.all = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const companies = await Company.find({ deleted: false })
      .populate("vehicles")
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("tier", "name type price transactionCost priority")
      .skip(skip)
      .limit(pageSize);
    const total = await Company.find().countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, meta);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get All unveried Companies by Admin
 * @param {*} req
 * @param {*} res
 */
exports.allUnveried = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const companies = await Company.find({ verified: false, deleted: false })
      .select("-password -rememberToken -deleted -deletedBy -deletedAt")
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority")
      .skip(skip)
      .limit(pageSize);
    const total = await Company.find({ verified: false }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, meta);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get Recruiting Company
 * @param {*} req
 * @param {*} res
 */
exports.recruiting = async (req, res, next) => {
  try {
    const settings = await Setting.find({
      recruitment: true,
      source: "company",
    });

    console.log("settings", settings);

    const companyIds = settings.map((v, i) => {
      return v.company;
    });
    console.log("companyIds", companyIds);

    const companies = await Company.find({
      _id: { $in: companyIds },
      verified: true,
      deleted: false,
    }).select("name state country");

    JsonResponse(res, 200, MSG_TYPES.FETCHED, companies, null);
    return;
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Update One Company
 * @param {*} req
 * @param {*} res
 */
exports.updateSingle = async (req, res, next) => {
  try {
    const { error } = validateUpdateCompany(req.body);
    if (error) {
      JsonResponse(res, 400, error.details[0].message);
      return;
    }

    const companyId = req.user.id;
    const company = await Company.findOne({ _id: companyId });

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      return;
    }

    if (req.body.country) {
      const country = await Country.findOne({ name: req.body.country });
      if (!country)
        return JsonResponse(res, 404, "Country Not Found");
    }

    // validate state
    if (req.body.state) {
      const state = country.states.filter((v, i) => v.name === req.body.state);
      if (typeof state[0] === "undefined")
        return JsonResponse(res, 404, "State Not Found");
    }

    const data = req.body;

    if (req.files) {
      if (req.files.rcDoc) {
        const rcDoc = await UploadFileFromBinary(
          req.files.rcDoc.data,
          req.files.rcDoc.name
        );
        req.body.rcDoc = rcDoc.Key;
      }
      if (req.files.logo) {
        const logo = await UploadFileFromBinary(
          req.files.logo.data,
          req.files.logo.name
        );
        req.body.logo = logo.Key;
      }
    }


    const updatedCompany = await Company.findByIdAndUpdate(companyId, data, {
      new: true,
    })
    .select('-password');

    JsonResponse(res, 200, MSG_TYPES.UPDATED, updatedCompany, null);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Update Company Status
 * @param {*} req
 * @param {*} res
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { error } = validateStatusUpdate(req.body);
    if (error) {
      return JsonResponse(res, 400, error.details[0].message);
    }
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      return;
    }
    const account = await Company.findOneAndUpdate(
      { _id: companyId },
      req.body
    );
    JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Admin verification for company account
 * @param {*} req
 * @param {*} res
 */
exports.verification = async (req, res, next) => {
  try {
    const { error } = validateCompanyVerification(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const company = await Company.findOne({
      _id: req.params.companyId,
      verified: false,
    });
    if (!company)
      return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    // check if the
    if (req.body.status === "decline") {
      if (company.type === "HQ") {
        const organization = await Organization.findById(company.organization);

        await organization.deleteOne();
      }
      await company.deleteOne();

      JsonResponse(res, 200, "Account Successfully Deleted");
      return;
    }

    await company.updateOne({
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: req.user.id,
      status: "active",
    });

    if (company.type === "HQ") {
      await Organization.updateOne(
        { _id: company.organization },
        { verified: true }
      );
    }

    const subject = "Welcome! Account Approved.";
    const html = Verification("111", company.email, "company");
    Mailer(company.email, subject, html);

    const newSetting = new Setting({
      company: company._id,
      organization: company.organization,
      source: "company",
      weightPrice: 0,
      documentPrice: 0,
      parcelPrice: 0,
    });

    await newSetting.save();

    JsonResponse(res, 200, MSG_TYPES.ACCOUNT_VERIFIED);
    return;
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Delete One Company
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res, next) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findById(companyId);

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      return;
    }
    company.deletedBy = req.user.id;
    company.deleted = true;
    company.deletedAt = Date.now();
    await company.save();
    JsonResponse(res, 200, MSG_TYPES.DELETED);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get me Transactions for a company
 * @param {*} req
 * @param {*} res
 */
exports.allTransactions = async (req, res, next) => {
  try {
    const company = req.user.id
    const { page, pageSize, skip } = paginate(req);

    const companyDetails = await Company.findOne({
      _id: company,
      verified: true,
      status: "active",
    })

    if (!companyDetails) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      return;
    }

    const { transactions, total } = await companyInstance.allTransactions(
      company, skip, pageSize
    )
    const meta = {
      total,
      pagination: { pageSize, page }
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, transactions, meta);
  } catch (error) {
    console.log(error);
    next(error);
  }
};


/**
 * Get all entry accepted by a company
 * @param {*} req
 * @param {*} res
 */
exports.entries = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const { entry, total } = await companyInstance.getAllEntries(
      req.user,
      skip,
      pageSize
    );
    const meta = {
      total,
      pagination: { pageSize, page }
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, entry, meta);
  } catch (error) {
    console.log(error);
    next(error);
  }
};


/**
 * Get all entry accepted by a company
 * @param {*} req
 * @param {*} res
 */
exports.getSingleEntry = async (req, res, next) => {
  try {
    const { entry } = await companyInstance.getSingleEntry(req.user, req.params.entryId);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, entry);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Get company statistics
 * @param {*} req
 * @param {*} res
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const statistics = await statisticsInstance.getGeneralStatistics({company: req.user.id});

    JsonResponse(res, 200, MSG_TYPES.FETCHED, statistics);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * GET general riders statistics
 * @param {*} req
 * @param {*} res
 */
exports.getRiderStatistics = async (req, res, next) => {
  try {
    const statistics = await companyInstance.getRiderStatistics(req.user.id);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, statistics);
    return
  } catch (error) {
    next(error);
    return
  }
}

/**
 * Change company password
 * @param {*} req
 * @param {*} res
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { error } = validateChangePassword(req.body);
    if (error) {
      return JsonResponse(res, 400, error.details[0].message);
    }

    await companyInstance.updatePassword(req.user.id, req.body);

    return JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    next(error);
  }
}

/**
 * GET company transactions statistics
 * @param {*} req
 * @param {*} res
 */
exports.getTransactionStatistics = async (req, res, next) => {
  try {
    const statistics = await companyInstance.getTransactionStatistics(req.user.id);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, statistics);
  } catch (error) {
    console.log(error);
    next(error);
  }
};