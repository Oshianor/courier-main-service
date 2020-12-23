const Subscription = require('../models/subscription');
const Company = require('../models/company');
const { MSG_TYPES } = require('../constant/types');

class SubscriptionService {

  /**
   * Create subscription
   * @param {Object} body
  */
  create(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const validCompany = await Company.findOne({ _id: body.company })

        if (!validCompany) {
          reject({ statusCode: 404, msg: "Company does not exist" })
          return
        }
        const existingSubscriptions = await Subscription.find({ company: body.company })
        if (existingSubscriptions.length > 0) {
          reject({ statusCode: 400, msg: "Subscription Exists" })
          return
        }
        const createSubscription = await Subscription.create(body)
        resolve(createSubscription)
      } catch (error) {
        reject({ statusCode: error.code, msg: error.msg });
        return
      }
    })
  }

  /**
   * Get my subscription
   * @param {MongoDB ObjectId} company
  */
  getSubscription(company) {
    return new Promise(async (resolve, reject) => {
      try {
        const subscription = await Subscription.findOne(company)
          .populate('company', 'name email phoneNumber contactName contactPhoneNumber address')
          .populate('pricing');
        if (!subscription) return reject({ statusCode: 400, msg: MSG_TYPES.NOT_FOUND })
        resolve(subscription)
      } catch (error) {
        console.log(error);
        reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR });
        return
      }
    })
  }

  /**
   * update subscription
   * @param {Object} company
   * @param {ObjectI} updateObject
  */
  editSubscription(company, updateObject) {
    return new Promise(async (resolve, reject) => {
      try {
        const validSubscription = await Subscription.findOne(company)
        if (!validSubscription) return reject({ statusCode: 400, msg: MSG_TYPES.NOT_FOUND })

        const updatedSubscription = await Subscription.updateOne(
          company,
          {
            $set: updateObject,
          }
        );

        if (!updatedSubscription) return reject({ statusCode: 404, msg: MSG_TYPES.NOT_FOUND })
        resolve(updatedSubscription)
      } catch (error) {
        reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
        return
      }
    })
  }

}


module.exports = SubscriptionService