const { nanoid } = require("nanoid");
const Subscription = require('../models/subscription');
const CompanyService = require("../services/company");
const SubscriptionHistory = require('../models/subscriptionHistory');
const Company = require('../models/company');
const Pricing = require('../models/pricing');
const Card = require('../models/card');
const config = require("config");
const paystack = require("paystack")(config.get("paystack.secret"));
const { MSG_TYPES } = require('../constant/types');

const companyInstance = new CompanyService();

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
  * Update subscription
  * @param {Object} body
 */
  update(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const company = await Company.findById(body.company)
        const pricing = await Pricing.findById(body.pricing)
        if (!pricing) return reject({ code: 400, msg: "Pricing plan not available" });
        const card = await Card.findOne({ _id: body.card, company: body.company })
        if (!card) return reject({ statusCode: 400, msg: "Card not found" })

        const paymentObject = {
          reference: nanoid(20),
          authorization_code: card.token,
          email: company.email,
          amount: pricing.transactionCost * 100,
        };
        // check if already on the current plan and subscription active
        if (!body.startEndOfCurrentPlan) {
          const activeSub = await Subscription.findOne({ company: body.company, pricing: body.pricing, status: "active" })
          if (activeSub) return reject({ statusCode: 400, msg: "Already an active subscription on this plan" })
        }

        if (body.startEndOfCurrentPlan) {
          const activeSub = await Subscription.findOne({ company: body.company, status: "active" })
          if (activeSub.nextPaidPlan != null || activeSub.nextPaidPlan != undefined) return reject({ statusCode: 400, msg: "Already paid for a subscription plan starting end of current plan" })
        }

        // charge company
        await this.subscriptionCharge(paymentObject)

        // update subscription
        let subscription;
        if (!body.startEndOfCurrentPlan) {
          subscription = await this.updateNow(body, pricing)
        } else {
          subscription = await this.updateLater(body, pricing)
        }
        resolve(subscription)
      } catch (error) {
        reject({ statusCode: error.code, msg: error.msg });
        return
      }
    })
  }

  /**
 * paystack payment charge
 * @param {Object} chargeObject
*/
  subscriptionCharge(chargeObject) {
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await paystack.transaction.charge(chargeObject);

        if (!transaction.status) {
          reject({ code: 400, msg: "Payment Error" });
          return;
        }
        if (transaction.data.status !== "success") {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
          return;
        }
        resolve()
      } catch (error) {
        reject({ statusCode: error.code, msg: error.msg })
        return
      }
    })
  }


  /**
  * update end of current plan
  * @param {Object} body
  * @param {Object} pricing
  */
  updateLater(body, pricing) {
    return new Promise(async (resolve, reject) => {
      try {
        const nextPaidPlan = pricing._id;
        const updateObject = {
          nextPaidPlan,
          duration: body.duration
        }
        const updatedSubscription = await Subscription.updateOne(
          { company: body.company },
          {
            $set: updateObject,
          }
        );
        if (!updatedSubscription) return reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })

        resolve(updatedSubscription)

      } catch (error) {
        reject({ statusCode: error.code, msg: error.msg })
        return
      }
    })
  }

  /**
  * Update subscription now
  * @param {Object} body
  */
  updateNow(body, pricing) {
    return new Promise(async (resolve, reject) => {
      try {
        const startDate = new Date();
        var endDate = new Date();
        endDate.setDate(endDate.getDate() + body.duration);

        const updateObject = {
          startDate,
          duration: body.duration,
          endDate,
          pricing: pricing._id
        }

        const updatedSubscription = await Subscription.updateOne(
          { company: body.company },
          {
            $set: updateObject,
          }
        );

        await SubscriptionHistory.create({
          company: body.company,
          pricing: pricing._id,
          startDate,
          endDate,
          duration,
        })
        companyInstance.updateCompany(body.company, { teir: pricing._id });
        resolve(updatedSubscription)
      } catch (error) {
        reject({ statusCode: error.code, msg: error.msg })
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
      // try {
      //   const validSubscription = await Subscription.findOne(company)
      //   if (!validSubscription) return reject({ statusCode: 400, msg: MSG_TYPES.NOT_FOUND })

      //   const updatedSubscription = await Subscription.updateOne(
      //     company,
      //     {
      //       $set: updateObject,
      //     }
      //   );

      //   if (!updatedSubscription) return reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
      //   resolve(updatedSubscription)
      // } catch (error) {
      //   reject({ statusCode: error.code, msg: error.msg })
      //   return
      // }
    })
  }

}


module.exports = SubscriptionService