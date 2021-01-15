const EnterpriseService = require("../services/enterprise");
const { validateEnterprise, validateMaintainer, validateEnterpriseUpdate } = require("../request/enterprise");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");
const OrderService = require("../services/order");
const enterpriseInstance = new EnterpriseService();

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
 * Update enterprise information
 * @param {*} req
 * @param {*} res
 */
exports.updateEnterprise = async (req, res, next) => {
  try {
    const { error } = validateEnterpriseUpdate(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    const enterpriseId = req.enterprise._id;
    await enterpriseInstance.updateEnterprise({ _id: enterpriseId }, req.body);
    return JsonResponse(res, 200, MSG_TYPES.UPDATED);
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
    const enterprise = await enterpriseInstance.getEnterprise({ email: req.enterprise.email });
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
    const statistics = await enterpriseInstance.getStatistics(req.enterprise);

    JsonResponse(res, 200, MSG_TYPES.FETCHED, statistics);
  } catch (error) {
    next(error);
  }
};