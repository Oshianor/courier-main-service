const SubscriptionService = require("../services/subscription");
const { validateSubscription, validateUpdateubscription } = require("../request/subscription");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const { paginate } = require("../utils");
const subscriptionInstance = new SubscriptionService();

/**
 * Create subscription
 * @param {*} req 
 * @param {*} res 
 */
exports.createSubscription = async (req, res, next) => {
  try {
    const { error } = validateSubscription(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const subscription = await subscriptionInstance.create(req.body)

    JsonResponse(res, 200, MSG_TYPES.CREATED, subscription);
    return;
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Get subscription
 * @param {*} req 
 * @param {*} res 
 */
exports.getSubscription = async (req, res, next) => {
  try {
    console.log('Request', req.body)
    const subscription = await subscriptionInstance.getSubscription(req.body)
    JsonResponse(res, 200, MSG_TYPES.FETCHED, subscription);
    return;
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Update subscription
 * @param {*} req 
 * @param {*} res 
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const { error } = validateUpdateubscription(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);
    req.body.duration = 30;
    let subscription;
    if (!req.body.startEndOfCurrentPlan) {
      subscription = await subscriptionInstance.updateNow(req.body)
    } else {
      subscription = await subscriptionInstance.updateLater(req.body)
    }
    JsonResponse(res, 200, "Successfully updated subscription", subscription);
    return;
  } catch (error) {
    next(error)
    return
  }
};

/**
 * Edit subscription
 * @param {*} req
 * @param {*} res
 */
// exports.editSubscription = async (req, res) => {
//   try {
//     const { error } = validateUpdateubscription(req.body);
//     if (error) return JsonResponse(res, 400, error.details[0].message);
//     const company = { company: req.user.id }

//     const subscriptionInstance = new SubscriptionService();
//     await subscriptionInstance.editSubscription(company, req.body);

//     JsonResponse(res, 200, MSG_TYPES.UPDATED);
//     return;
//   } catch (error) {
//     next(error)
//     return
//   }
// };

