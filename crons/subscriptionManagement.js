const mongoose = require("mongoose");
const config = require("config");
const moment = require("moment");
const Entry = require("../models/entry");
const { AsyncForEach } = require("../utils");
const Subscription = require("../models/subscription");
const SubscriptionService = require("../services/subscription");
const Pricing = require("../models/pricing");
const Company = require("../models/company");
const Card = require("../models/card");
const { nanoid } = require("nanoid");
const { MSG_TYPES } = require("../constant/types");
const subscriptionService = new SubscriptionService();
const winston = require("winston");

mongoose
  .connect(config.get("database.url"), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB...");
    handleSubscriptionManagement();
  })
  .catch((err) => console.error("Could not connect to MongoDB..."));

/**
 * Check for post that have been accepted and not passed to riders
 * removed from their list and back into the pool.
 */
const handleSubscriptionManagement = async () => {
  try {

    const activeSubscriptions = await Subscription.find({
      status: "active",
    });

    for await (let subscription of activeSubscriptions){
      const expiryDate = moment(subscription.endDate);
      const now = moment();

      if(now.isSameOrAfter(expiryDate)){
        if(subscription.nextPaidPlan){
          const nextPlan = await Pricing.findOne({_id: subscription.nextPaidPlan});

          await subscriptionService.updateNow({
            company: subscription.company,
            duration: 30
          }, nextPlan);

        } else {
          const basicPlan = await Pricing.findOne({type: "freemium"});
          if(subscription.pricing.toString() == basicPlan._id.toString()){
            await downgradeSubscription(subscription);
          } else {
            await renewSubscription(subscription);
          }
        }
      } else {
        console.log('Plan has not expired');
      }
    }
  } catch (error) {
    const errorMessage = `Subscription Management cron error ${new Date()} => ${error.toString()}`
    console.log(errorMessage);
    winston.error(errorMessage);
  }
}

// handleSubscriptionManagement();

async function renewSubscription(subscription){
  try{
    const currentPlan = await Pricing.findOne({_id: subscription.pricing});
    const company = await Company.findOne({_id: subscription.company});
    const card = await Card.findOne({company: subscription.company, default: true});

    if(!card){
      return downgradeSubscription(subscription);
    }

    const subscriptionChargeData = {
      reference: nanoid(20),
      authorization_code: card.token,
      email: company.email,
      amount: Number(currentPlan.price) * 100,
    }
    console.log(subscriptionChargeData);
    await subscriptionService.subscriptionCharge(subscriptionChargeData);

    await subscriptionService.updateNow({
      company: subscription.company,
      duration: 30
    }, currentPlan);

  } catch(error){
    if(error.msg && error.msg === MSG_TYPES.PAYMENT_ERROR){
      await downgradeSubscription(subscription);
    }

    const errorMessage = `Subscription renewal error ${new Date()} => ${error.toString()}`
    console.log(errorMessage);
    winston.error(errorMessage);
  }
}


async function downgradeSubscription(subscription){
  const basicPlan = await Pricing.findOne({type: "freemium"});

  await subscriptionService.updateNow({
    company: subscription.company,
    duration: 30
  }, basicPlan);
}