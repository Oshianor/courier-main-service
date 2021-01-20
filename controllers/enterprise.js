const EnterpriseService = require("../services/enterprise");
const { validateEnterprise, validateMaintainer, validateEnterpriseUpdate } = require("../request/enterprise");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");
const OrderService = require("../services/order");
const UserService = require("../services/user");
const StatisticsService = require("../services/statistics");
const userInstance = new UserService();
const enterpriseInstance = new EnterpriseService();
const statisticsInstance = new StatisticsService();


/**
 * Create organization
 * @param {*} req
 * @param {*} res
 */
exports.createOrganization = async (req, res, next) => {
  try {
    const { error } = validateEnterprise(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const { newEnterprise } = await enterpriseInstance.createOrganization(
      req.body,
      req.files,
      req.user
    );

    return JsonResponse(res, 200, MSG_TYPES.CREATED, newEnterprise);
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Create branch
 * @param {*} req
 * @param {*} res
 */
exports.createBranch = async (req, res, next) => {
  try {
    const { error } = validateEnterprise(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const { newEnterprise } = await enterpriseInstance.createBranch(
      req.body,
      req.files,
      req.enterprise
    );
    return JsonResponse(res, 200, MSG_TYPES.CREATED, newEnterprise);

  } catch (error) {
    next(error);
    return
  }
};

/**
 * Create maintainer
 * @param {*} req
 * @param {*} res
 */
exports.createMaintainer = async (req, res, next) => {
  try {
    const { error } = validateMaintainer(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const { user } = await enterpriseInstance.createMaintainer(req.body, req.enterprise);

    return JsonResponse(res, 200, MSG_TYPES.CREATED, user);
  } catch (error) {
    next(error)
    return
  }
};


/**
 * Add card for enterprise accounts
 * @param {*} req
 * @param {*} res
 */
exports.addCard = async (req, res, next) => {
  try {
    const card = await enterpriseInstance.addCard(req.body, req.token);
    return JsonResponse(res, 200, card.data.msg, card.data.data);
  } catch (error) {
    next(error)
    return
  }
};

/**
 * get all cards for enterprise accounts
 * @param {*} req
 * @param {*} res
 */
exports.getCards = async (req, res, next) => {
  try {
    const card = await userInstance.getAllEnterpriseCard(req.enterprise.user);

    return JsonResponse(res, 200, card.msg, card.data);
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Update enterprise information
 * @param {*} req
 * @param {*} res
 */
exports.updateEnterprise = async (req, res, next) => {
  try {
    const { error } = validateEnterpriseUpdate(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const enterpriseId = req.enterprise._id;
    const updatedEnterprise = await enterpriseInstance.updateEnterprise({ _id:enterpriseId },  req.body, req.token);

    return JsonResponse(res, 200, MSG_TYPES.UPDATED, updatedEnterprise);
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Get enterprise information
 * @param {*} req
 * @param {*} res
 */
exports.getEnterprise = async (req, res, next) => {
  try {
    const enterprise = await enterpriseInstance.getEnterprise(req.user.id);
    return JsonResponse(res, 200, MSG_TYPES.FETCHED, enterprise);
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Get All Enterprise branches
 * @param {*} req
 * @param {*} res
 */
exports.allBranches = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const pagination = {
      page,
      skip,
      pageSize,
    };
    const {
      total,
      branches,
    } = await enterpriseInstance.getAllBranches(req.user, pagination);
    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, branches, meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Enterprise maintainers
 * @param {*} req
 * @param {*} res
 */
exports.allMaintainers = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);
    const pagination = {
      page,
      skip,
      pageSize
    }

    const { total, maintainers } = await enterpriseInstance.getAllMaintainers(req.user, pagination);

    const meta = {
      total,
      pagination: { pageSize, page },
    };

    JsonResponse(res, 200, MSG_TYPES.FETCHED, maintainers, meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Enterprise Entries
 * @param {*} req
 * @param {*} res
 */
exports.allEntries = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const { entries, total } = await enterpriseInstance.getAllEntries(
      req.enterprise,
      skip,
      pageSize
    );
    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, entries, meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Enterprise Transactions
 * @param {*} req
 * @param {*} res
 */
exports.allTransactions = async (req, res, next) => {
  try {
    const { page, pageSize, skip } = paginate(req);

    const { transactions, total } = await enterpriseInstance.getAllTransactions(
      req.enterprise,
      skip,
      pageSize
    );
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
 * Get All Enterprise Pending orders
 * @param {*} req
 * @param {*} res
 */
exports.getPendingOrders = async (req, res, next) => {
  try {
    const orderInstance = new OrderService();
    const { orders } = await orderInstance.getAll({
      enterprise: req.enterprise._id,
      status: "pending"
    }, {}, '', {pageSize: 5});

    JsonResponse(res, 200, MSG_TYPES.FETCHED, orders);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Enterprise statistics
 * @param {*} req
 * @param {*} res
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const statistics = await statisticsInstance.getGeneralStatistics({enterprise: req.enterprise._id});

    JsonResponse(res, 200, MSG_TYPES.FETCHED, statistics);
  } catch (error) {
    next(error);
  }
};


