const mongoose = require("mongoose");
const config = require("config");
const moment = require("moment");
const Entry = require("../models/entry");
const User = require("../models/users");
const Order = require("../models/order");
const Company = require("../models/company");
const Transaction = require("../models/transaction");
const UserService = require("./user");
const paystack = require("paystack")(config.get("paystack.secret"));
const { nanoid } = require("nanoid");
const { MSG_TYPES } = require("../constant/types");


class TransactionService {
  /**
   * Create transaction for entry
   * @param {Object} body
   * @param {Object} user
   * @param {String} token
   */
  createTransaction(body, user, token) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();
      try {
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "request",
          user: user.id,
        });

        if (!entry) {
          reject({
            code: 404,
            msg: "Entry transaction already processed.",
          });
          return;
        }

        // get price of the trip based on the pickup type
        let amount = 0;
        if (body.pickupType === "instant") {
          amount = parseFloat(entry.TEC) * parseFloat(entry.instantPricing);
        } else {
          amount = parseFloat(entry.TEC);
        }

        let msgRES;
        if (body.paymentMethod === "card") {
          const { card, trans } = await this.changeCard(
            body,
            user,
            amount,
            token
          );

          body.amount = amount;
          body.user = user.id;
          body.status = "approved";
          body.approvedAt = new Date();
          body.entry = entry;
          body.txRef = trans.data.reference;
          body.instantPricing = entry.instantPricing;

          msgRES = "Payment Successfully Processed";
        } else {
          body.amount = amount;
          body.user = user.id;
          body.status = "pending";
          body.entry = entry;
          body.txRef = nanoid(10);
          body.instantPricing = entry.instantPricing;

          msgRES = "Cash Payment Method Confirmed";
        }

        // start our transaction
        session.startTransaction();

        const newTransaction = new Transaction(body);
        await newTransaction.save({ session });
        await entry.updateOne(
          {
            transaction: newTransaction._id,
            pickupType: body.pickupType,
            status: "pending",
            approvedAt: new Date(),
            paymentMethod: body.paymentMethod,
          },
          { session }
        );
        await Order.updateMany(
          { entry: body.entry },
          {
            transaction: newTransaction._id,
            pickupType: body.pickupType,
          },
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        // send out new entry that has apporved payment method
        entry.metaData = null;
        resolve({ entry, msg: msgRES });
      } catch (error) {
        await session.abortTransaction();
        console.log("error", error);
        // reject({
        //   code: error.code,
        //   msg: error.msg,
        // });
        reject({
          code: 500,
          msg: "Your Transaction could't be processed at the moment",
        });
      }
    });
  }

  /**
   * Charge card
   * @param {Object} body
   * @param {Object} user
   * @param {String} token
   */
  changeCard(body, user, amount, token) {
    return new Promise(async (resolve, reject) => {
      try {
        const userInstance = new UserService();
        const card = await userInstance.getCard(token, body.card);

        const trans = await paystack.transaction.charge({
          reference: nanoid(20),
          authorization_code: card.data.token,
          email: user.email,
          amount: parseFloat(amount).toFixed(2) * 100,
        });
        console.log("trans", trans);

        if (!trans.status) {
          reject({
            code: 404,
            msg: "Your Transaction could't be processed at the moment",
          });
          return;
        }
        if (trans.data.status !== "success") {
          reject({
            code: 404,
            msg: "Your Transaction could't be processed at the moment",
          });
          return;
        }

        resolve({ card, trans });
      } catch (error) {
        reject({
          code: 500,
          msg: "Your card payment couldn't be processed",
        });
      }
    });
  }
}

module.exports = TransactionService;
