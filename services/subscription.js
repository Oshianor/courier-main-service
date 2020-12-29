const Subscription = require('../models/subscription');
const SubscriptionHistory = require('../models/subscriptionHistory');
const Company = require('../models/company');
const Pricing = require('../models/pricing');
const Card = require('../models/company');
const config = require("config");
const paystack = require("paystack")(config.get("paystack.secret"));
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
  * Update subscription now
  * @param {Object} body
 */
  updateNow(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const company = await Company.findById(body.company)
        const pricing = await Pricing.findById(body.pricing)
        const card = await Card.find({ _id: body.card, company: body.company })
        if (!card) return reject({ statusCode: 400, msg: "Card not found" })

        const transaction = await paystack.transaction.charge({ reference: card.txRef, authorization_code: card.token, email: company.email, amount: pricing.transactionCost * 100 });

        if (!transaction.status) {
          reject({ code: 400, msg: "Payment Error" });
          return;
        }
        if (transaction.data.status !== "success") {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
          return;
        }
        // const subscription = await Subscription.find({ company: body.company })
        let updateObject;
        const startDate = new Date();
        const duration = body.duration;
        var endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        updateObject = {
          startDate,
          duration,
          endDate,
          pricing: pricing._id
        }

        const updatedSubscription = await Subscription.updateOne(
          { company: body.company },
          {
            $set: updateObject,
          }
        );

        const logSubscription = await SubscriptionHistory.create({
          company: body.company,
          pricing: pricing._id,
          startDate,
          endDate,
          duration,
        })
        if (!updatedSubscription) return reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
        resolve({ updatedSubscription, logSubscription })

      } catch (error) {
        reject({ statusCode: error.code, msg: error.msg });
        return
      }
    })
  }

  /**
  * Update subscription later
  * @param {Object} body
 */
  updateLater(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const company = await Company.findById(body.company)
        const pricing = await Pricing.findById(body.pricing)
        const card = await Card.find({ _id: body.card, company: body.company })
        if (!card) return reject({ statusCode: 400, msg: "Card not found" })

        const transaction = await paystack.transaction.charge({ reference: card.txRef, authorization_code: card.token, email: company.email, amount: pricing.transactionCost * 100 });

        if (!transaction.status) {
          reject({ code: 400, msg: "Payment Error" });
          return;
        }
        if (transaction.data.status !== "success") {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
          return;
        }
        // const subscription = await Subscription.find({ company: body.company })
        const nextPaidPlan = pricing._id;
        updateObject = {
          nextPaidPlan,
          duration
        }

        const updatedSubscription = await Subscription.updateOne(
          { company: body.company },
          {
            $set: updateObject,
          }
        );
        if (!updatedSubscription) return reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
        resolve({ updatedSubscription, logSubscription })

      } catch (error) {
        reject({ statusCode: error.code, msg: error.msg });
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

        if (!updatedSubscription) return reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
        resolve(updatedSubscription)
      } catch (error) {
        reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
        return
      }
    })
  }

}


module.exports = SubscriptionService