const mongoose = require("mongoose");
const config = require("config");
const Entry = require("../models/entry");
const Company = require("../models/company");
const Pricing = require("../models/pricing");
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
        })
        .populate("orders");

        if (!entry) {
          return reject({
            code: 404,
            msg: "Entry transaction already processed.",
          });
        }

        // get price of the trip based on the pickup type
        // const { amount, orders } = await this.pickupType(body, entry, session);

        // console.log("amount, orders", amount, orders);


        let msgRES;
        const transactionData = {
          ...body,
          user: user.id,
          status: "approved",
          approvedAt: new Date(),
          entry: entry._id,
          instantPricing: entry.instantPricing,
          company: entry.company,
          // commissionPercent: pricing.transactionCost,
        }

        let amount = parseFloat(entry.TEC);
        if(body.pickupType === "instant"){
          amount = calculateInstantPrice(entry.TEC, entry.instantPricing);
        }

        if (body.paymentMethod === "card") {
          const card = await cardInstance.get({ _id: body.card, user: user.id });
          const { trans } = await this.chargeCard(card, amount)

          transactionData.txRef = trans.data.reference;

          msgRES = "Payment Successfully Processed";
        } else {
          transactionData.status = "pending";

          msgRES = "Cash Payment Method Confirmed";
        }

        const createdTransactions = await this.createTransactionsForOrders(entry, transactionData, body.pickupType, session);

        const transactionIds = createdTransactions.map((trx) => trx._id);

        await entry.updateOne(
          {
            transaction: transactionIds,
            pickupType: body.pickupType,
            status: "pending",
            approvedAt: new Date(),
            TEC: amount,
            paymentMethod: body.paymentMethod,
            cashPaymentType: body.cashPaymentType
          },
          { session }
        );
        await Order.updateMany(
          { entry: body.entry },
          {
            status: "pending",
            pickupType: body.pickupType,
            paymentMethod: body.paymentMethod,
            cashPaymentType: body.cashPaymentType
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

        // calculate our commision from the company pricing plan
        const company = await Company.findOne({
          _id: entry.company,
          status: "active",
          verified: true,
          ownership: true,
        }).lean();

        if (!company) {
          reject({ code: 400, msg: "No company account was found." });
          return;
        }

        const pricing = await Pricing.findOne({ _id: company.tier }).lean();
        if (!pricing) {
          reject({
            code: 400,
            msg: "You're currently not on any plan at the moment",
          });
          return;
        }

        let msg;
        const transactionData = {
          ...body,
          enterprise: enterprise._id,
          user: user.id,
          status: "approved",
          approvedAt: new Date(),
          entry: entry._id,
          instantPricing: entry.instantPricing,
          company: entry.company,
          commissionPercent: pricing.transactionCost,
        }

        let amount = parseFloat(entry.TEC);
        if(body.pickupType === "instant"){
          amount = calculateInstantPrice(entry.TEC, entry.instantPricing);
        }

        if (body.paymentMethod === "card") {
          const card = await cardInstance.get({ _id: body.card, user: user.id });

          const { trans } = await this.chargeCard(card, amount);

          transactionData.txRef = trans.data.reference;

          msg = "Card Payment Successfully Processed";

        } else if (body.paymentMethod === "wallet") {
          await this.chargeWallet(enterprise, amount, user, body.entry);

          msg = "Wallet Payment Successfully Processed";
        } else if (body.paymentMethod === "credit") {
          await this.chargeCredit(enterprise, amount, user, body.entry);

          msg = "Payment Successfully Processed with line of Credit";
        } else {
          transactionData.status = "pending";

          msg = "Cash Payment Method Confirmed";
        }

        const createdTransactions = await this.createTransactionsForOrders(entry, transactionData, body.pickupType, session);


        const transactionIds = createdTransactions.map((trx) => trx._id);

        await entry.updateOne(
          {
            enterprise: enterprise._id,
            transaction: transactionIds,
            pickupType: body.pickupType,
            status: "companyAccepted",
            approvedAt: new Date(),
            TEC: amount,
            paymentMethod: body.paymentMethod,
            cashPaymentType: body.cashPaymentType
          },
          { session }
        );
        await Order.updateMany(
          { entry: body.entry },
          {
            status: "pending",
            enterprise: enterprise._id,
            pickupType: body.pickupType,
            paymentMethod: body.paymentMethod,
            cashPaymentType: body.cashPaymentType
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
   * Calculate pickup time
   * @param {Object} body
   * @param {Object} entry
   * @param {Object} order
   * @param {Object} session
   * @returns
   */
  pickupType(body, entry, session) {
    return new Promise(async (resolve, reject) => {
      try {
        let amount = 0;
        const orders = await Order.find({ entry: entry._id }).lean();

        if (body.pickupType === "instant") {
          amount = calculateInstantPrice(entry.TEC, entry.instantPricing);

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

        resolve({ amount, orders });
      } catch (error) {
        reject({ code: 400, msg: "Something went wrong" })
      }
    })
  }

  /**
   *
   * @param {Object} entry
   * @param {Object} transactionData
   * @param {string} pickupType
   * @param {Object} session
   */
  createTransactionsForOrders(entry, transactionData, pickupType, session){
    return new Promise(async(resolve, reject) => {
      try{
        const transactions = [];
        for await (let order of entry.orders) {

          let orderCost = order.estimatedCost;
          if(pickupType === "instant"){
            orderCost = calculateInstantPrice(order.estimatedCost, entry.instantPricing);
          }

          transactionData = {
            ...transactionData,
            order: order._id,
            amount: orderCost,
            txRef: nanoid(10),
          }

          if(transactionData.commissionPercent){
            const commissionAmount = parseFloat((orderCost * transactionData.commissionPercent) / 100);

            transactionData.commissionAmount = commissionAmount;
            transactionData.amountWOcommision = parseFloat(orderCost - commissionAmount)
          }

          const newTransaction = new Transaction(transactionData);

          const createdTransaction = await newTransaction.save({ session });
          await order.updateOne({ transaction: newTransaction._id }, { session });

          transactions.push(createdTransaction);
        }

        resolve(transactions);
      } catch(error){
        console.log(error);
        reject({ code: 400, msg: "Something went wrong", service: 'createTransactionsForOrders'});
      }
    })
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

  /**
   * Update Mutiple Orders
   * @param {Object} filter
   * @param {Object} set
   */
  updateAll(filter = {}, set = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if we have pricing for the location
        const transaction = await Transaction.updateMany(filter, set);

        resolve(transaction);
      } catch (error) {
        console.log(error);
        reject({ code: 500, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

}




module.exports = TransactionService;
