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
          reject({ code: 404, msg: "Company does not exist" })
          return
        }
        const existingSubscriptions = await Subscription.find({ company: body.company })
        if (existingSubscriptions.length > 0) {
          reject({ code: 400, msg: "Subscription Exists" })
          return
        }
        const createSubscription = await Subscription.create(body)
        resolve(createSubscription)
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
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
        if (!subscription) return reject({ code: 400, msg: "No subscription was found for your account" })
        resolve(subscription)
      } catch (error) {
        console.log(error);
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
        returncode
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
        if (!pricing) return reject({ code: 404, msg: "Pricing plan not available" });
        const card = await Card.findOne({ _id: body.card, company: body.company })
        if (!card) return reject({ code: 404, msg: "Card not found" })

        // check if already on the current plan and subscription active
        if (!body.startEndOfCurrentPlan) {
          const chosenPlanActiveSub = await Subscription.findOne({
            company: body.company,
            pricing: body.pricing,
            status: "active"
          });

          if (chosenPlanActiveSub) {
            return reject({ code: 400, msg: "You already have an active subscription on this plan"});
          }
        }

        const activeSub = await Subscription.findOne({ company: body.company, status: "active" })
        if (activeSub.nextPaidPlan){
          return reject({ code: 400, msg: "You already paid for a subscription plan starting at the end of your current plan"});
        }

        const paymentObject = {
          reference: nanoid(20),
          authorization_code: card.token,
          email: company.email,
          amount: Number(pricing.price) * 100,
        };
        // charge company
        await this.subscriptionCharge(paymentObject);

        // update subscription
        let subscription;
        if (!body.startEndOfCurrentPlan) {
          subscription = await this.updateNow(body, pricing)
        } else {
          subscription = await this.updateLater(body, pricing)
        }
        resolve(subscription);

        // set used card as default
        console.log('Setting card as default')
        if(!card.default){
          card.updateOne({ default: true });
        }
      } catch (error) {
        return reject({ code: error.code, msg: error.msg });
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
          return reject({ code: 400, msg: MSG_TYPES.PAYMENT_ERROR });
        }
        if (transaction.data.status !== "success") {
          return reject({ code: 400, msg: MSG_TYPES.PAYMENT_ERROR });
        }
        resolve();
      } catch (error) {
        reject({ code: error.code || 500, msg: error.msg || MSG_TYPES.SERVER_ERROR})
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
        if (!updatedSubscription) return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })

        resolve(updatedSubscription)

      } catch (error) {
        return reject({ statusCode: error.code, msg: error.msg })
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
        endDate.setDate(startDate.getDate() + body.duration);

        const updateObject = {
          duration: body.duration,
          pricing: pricing._id,
          nextPaidPlan: null,
          startDate,
          endDate,
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
          duration: body.duration,
          startDate,
          endDate,
        });

        await companyInstance.updateCompany(body.company, { tier: pricing._id });

        resolve(updatedSubscription)
      } catch (error) {
        return reject({ statusCode: error.code, msg: error.msg })
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
      //   if (!validSubscription) return reject({ code: 400, msg: MSG_TYPES.NOT_FOUND })

      //   const updatedSubscription = await Subscription.updateOne(
      //     company,
      //     {
      //       $set: updateObject,
      //     }
      //   );

      //   if (!updatedSubscription) return reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR })
      //   resolve(updatedSubscription)
      // } catch (error) {
      //   reject({ code: error.code, msg: error.msg })
      //   return
      // }
    })
  }

}


module.exports = SubscriptionService