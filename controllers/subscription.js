const SubscriptionService = require("../services/subscription");
const { validateSubscription, validateUpdateubscription } = require("../request/subscription");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");

/**
 * Create subscription
 * @param {*} req 
 * @param {*} res 
 */
exports.createSubscription = async (req, res) => {
  try {
    const { error } = validateSubscription(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    req.body.company = req.user.id;

    const subscriptionInstance = new SubscriptionService();
    const subscription = await subscriptionInstance.create(req.body)

    JsonResponse(res, 200, MSG_TYPES.CREATED, subscription);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Get subscription
 * @param {*} req 
 * @param {*} res 
 */
exports.getSubscription = async (req, res) => {
  try {
    req.body.company = req.user.id;
    const subscriptionInstance = new SubscriptionService();
    const subscription = await subscriptionInstance.getSubscription(req.body)
    JsonResponse(res, 200, MSG_TYPES.FETCHED, subscription);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Edit subscription
 * @param {*} req 
 * @param {*} res 
 */
exports.editSubscription = async (req, res) => {
  try {
    const { error } = validateUpdateubscription(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    const company = { company: req.user.id }

    const subscriptionInstance = new SubscriptionService();
    await subscriptionInstance.editSubscription(company, req.body);

    JsonResponse(res, 200, MSG_TYPES.UPDATED);
    return;
  } catch (error) {
    return JsonResponse(res, error.code, error.msg);
  }
};

