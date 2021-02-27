const mongoose = require("mongoose");
const config = require("config");
const Entry = require("../models/entry");
const Order = require("../models/order");
const Transaction = require("../models/transaction");
const UserService = require("./user");
const CardService = require("./card");
const paystack = require("paystack")(config.get("paystack.secret"));
const { nanoid } = require("nanoid");
const { MSG_TYPES } = require("../constant/types");
const Wallet = require("../models/wallet");
const WalletHistory = require("../models/walletHistory");
const Credit = require("../models/credit");
const CreditHistory = require("../models/creditHistory");
const EnterpriseService = require("./enterprise");
const cardInstance = new CardService();
const { populateMultiple } = require("../services/aggregate");
const { calculateInstantPrice } = require("../utils");


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
        // start our transaction
        session.startTransaction();

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
          amount = calculateInstantPrice(entry.TEC, entry.instantPricing);

          const orders = await Order.find({entry: entry._id }).lean();

          for await(let order of orders){
            let orderCost = calculateInstantPrice(order.estimatedCost, entry.instantPricing);
            await Order.updateOne(
              { _id: order._id },
              { estimatedCost: orderCost },
              { session }
            );
          }

        } else {
          amount = parseFloat(entry.TEC);
        }

        let msgRES;
        if (body.paymentMethod === "card") {
          const card = await cardInstance.get({ _id: body.card, user: user.id });
          const { trans } = await this.chargeCard(card, amount)

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
        // session.startTransaction();

        const newTransaction = new Transaction(body);
        await newTransaction.save({ session });
        await entry.updateOne(
          {
            transaction: newTransaction._id,
            pickupType: body.pickupType,
            status: "pending",
            approvedAt: new Date(),
            TEC: amount,
            paymentMethod: body.paymentMethod,
          },
          { session }
        );
        await Order.updateMany(
          { entry: body.entry },
          {
            status: "pending",
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
        reject(error);
      }
    });
  }

  /**
   * Create transaction for entry
   * @param {Object} body
   * @param {Object} user
   * @param {Object} enterprise
   */
  createEnterpriseTransaction(body, user, enterprise) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();
      try {
        // start our transaction
        session.startTransaction();

        const entry = await Entry.findOne({
          _id: body.entry,
          status: "request",
          user: user.id,
        })
          .populate("orders")
          .populate("user", "name email phoneNumber countryCode")
          .select("-metaData")

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
          amount = calculateInstantPrice(entry.TEC, entry.instantPricing);

          const orders = await Order.find({ entry: entry._id }).lean();

          for await (let order of orders) {
            let orderCost = calculateInstantPrice(
              order.estimatedCost,
              entry.instantPricing
            );
            await Order.updateOne(
              { _id: order._id },
              { estimatedCost: orderCost },
              { session }
            );
          }
        } else {
          amount = parseFloat(entry.TEC);
        }

        let msg;
        if (body.paymentMethod === "card") {
          const card = await cardInstance.get({ _id: body.card, user: user.id });

          const { trans } = await this.chargeCard(card, amount);

          body.enterprise = enterprise._id;
          body.amount = amount;
          body.user = user.id;
          body.status = "approved";
          body.approvedAt = new Date();
          body.entry = entry;
          body.txRef = trans.data.reference;
          body.instantPricing = entry.instantPricing;

          msg = "Card Payment Successfully Processed";
        } else if (body.paymentMethod === "wallet") {
          await this.chargeWallet(enterprise, amount, user, body.entry);

          body.enterprise = enterprise._id;
          body.amount = amount;
          body.user = user.id;
          body.status = "approved";
          body.approvedAt = new Date();
          body.entry = entry;
          body.txRef = nanoid(10);
          body.instantPricing = entry.instantPricing;

          msg = "Wallet Payment Successfully Processed";
        } else if (body.paymentMethod === "credit") {
          await this.chargeCredit(enterprise, amount, user, body.entry);

          body.enterprise = enterprise._id;
          body.amount = amount;
          body.user = user.id;
          body.status = "approved";
          body.approvedAt = new Date();
          body.entry = entry;
          body.txRef = nanoid(10);
          body.instantPricing = entry.instantPricing;

          msg = "Payment Successfully Processed with line of Credit";
        } else {
          body.enterprise = enterprise._id;
          body.amount = amount;
          body.user = user.id;
          body.status = "pending";
          body.entry = entry;
          body.txRef = nanoid(10);
          body.instantPricing = entry.instantPricing;

          msg = "Cash Payment Method Confirmed";
        }

        // start our transaction
        // session.startTransaction();

        const newTransaction = new Transaction(body);
        await newTransaction.save({ session });
        await entry.updateOne(
          {
            enterprise: enterprise._id,
            transaction: newTransaction._id,
            pickupType: body.pickupType,
            status: "companyAccepted",
            approvedAt: new Date(),
            TEC: amount,
            paymentMethod: body.paymentMethod,
          },
          { session }
        );
        await Order.updateMany(
          { entry: body.entry },
          {
            status: "pending",
            transaction: newTransaction._id,
            enterprise: enterprise._id,
            pickupType: body.pickupType,
          },
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        // send out new entry that has apporved payment method
        entry.metaData = null;
        resolve({ entry, msg });
      } catch (error) {
        await session.abortTransaction();
        console.log("error", error);
        reject(error);
      }
    });
  }

  /**
   * Charge card
   * @param {Object} body
   * @param {number} amount
   */
  chargeCard(card, amount) {
    return new Promise(async (resolve, reject) => {
      console.log("card", card);
      try {
        const trans = await paystack.transaction.charge({
          reference: nanoid(20),
          authorization_code: card.token,
          email: card.email,
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

        resolve({ trans });
      } catch (error) {
        reject({
          code: 500,
          msg: "Your card payment couldn't be processed",
        });
      }
    });
  }

  /**
   * Charge enterprise wallet
   * @param {Object} enterprise
   * @param {Number} amount
   * @param {Object} user
   * @param {Object} entry
   */
  chargeWallet(enterprise, amount, user, entry) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();

      try {
        // start our transaction
        session.startTransaction();

        const wallet = await Wallet.findOne({ enterprise: enterprise._id });

        if (!wallet) {
          return reject({
            code: 500,
            msg: "No wallet was found for your account.",
          });
        }

        if (parseFloat(wallet.balance) < parseFloat(amount)) {
          return reject({
            code: 500,
            msg:
              "You don't have enough in your wallet belanace to process this transaction",
          });
        }

        await wallet.updateOne(
          {
            $inc: { totalSpent: amount, balance: -amount },
          },
          { session }
        );

        const wallethistory = new WalletHistory({
          txRef: nanoid(20),
          type: "debit",
          user: user.id,
          amount,
          status: "approved",
          enterprise: enterprise._id,
          entry: entry,
          wallet: wallet._id,
        });

        await wallethistory.save({ session });

        await session.commitTransaction();
        session.endSession();

        resolve({ wallet, wallethistory });
      } catch (error) {
        console.log("error", error);
        await session.abortTransaction();
        reject({ code: 400, msg: "Wallet transaction couldn't processed." });
      }
    });
  }

  /**
   * Charge enterprise line of credit
   * @param {Object} enterprise
   * @param {Number} amount
   * @param {Object} user
   * @param {Object} entry
   */
  chargeCredit(enterprise, amount, user, entry) {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();

      try {
        // start our transaction
        session.startTransaction();

        const credit = await Credit.findOne({ enterprise: enterprise._id });

        if (!credit) {
          return reject({
            code: 500,
            msg: "No line of credit was found for your account.",
          });
        }

        if (parseFloat(credit.balance) < parseFloat(amount)) {
          return reject({
            code: 500,
            msg: "You don't have enough credit to process this transaction",
          });
        }

        await credit.updateOne(
          {
            $inc: { totalSpent: amount, balance: -amount },
          },
          { session }
        );

        const creditHistory = new CreditHistory({
          txRef: nanoid(20),
          type: "debit",
          user: user.id,
          amount,
          status: "approved",
          enterprise: enterprise._id,
          entry: entry,
        });

        await creditHistory.save({ session });

        await session.commitTransaction();
        session.endSession();

        resolve({ credit, creditHistory });
      } catch (error) {
        console.log("error", error);
        await session.abortTransaction();
        reject({ code: 400, msg: "Credit transaction couldn't processed." });
      }
    });
  }


   /**
   * Get all Transactions
   * @param {MongoDB ObjectId} enterpriseId
   * @param {number} skip
   * @param {number} pageSize
   */
  getAll(filter, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {

        let transactions = await Transaction.find(filter)
          // .populate("user", "name email countryCode phoneNumber")
          .populate('rider', 'name email countryCode phoneNumber')
          .populate('company', 'name email address countryCode phoneNumber')
          // .populate('enterprise', 'name email address countryCode phoneNumber')
          .skip(skip)
          .limit(pageSize)
          .sort({ createdAt: "desc" })
          .lean();

        // transactions = await populateMultiple(transactions, 'enterprise');
        transactions = await populateMultiple(transactions, "user", "name email countryCode phoneNumber");

        const total = await Transaction.countDocuments(filter);

        resolve({ transactions, total });
      } catch (error) {
        console.log(error);
        return reject(error);
      }
    });
  }

}




module.exports = TransactionService;
