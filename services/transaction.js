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
const Wallet = require("../models/wallet");
const WalletHistory = require("../models/walletHistory");
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
          const userInstance = new UserService();
          const card = await userInstance.getCard(token, body.card);
          const { trans } = await this.changeCard(card, amount);

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
            TEC: amount,
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
        reject({
          code: 500,
          msg: "Your Transaction could't be processed at the moment",
        });
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
        const entry = await Entry.findOne({
          _id: body.entry,
          status: "request",
          user: user.id,
        })
          .populate("orders")
          .populate("user", "name email phoneNumber countryCode")
          .select("-metaData");

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

        let msg;
        if (body.paymentMethod === "card") {
          const userInstance = new UserService();
          const card = await userInstance.getCardByUserId(
            enterprise.user,
            body.card
          );

          const { trans } = await this.changeCard(card, amount);

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
          await this.chargeWallet(enterprise, amount, user);

          body.enterprise = enterprise._id;
          body.amount = amount;
          body.user = user.id;
          body.status = "approved";
          body.approvedAt = new Date();
          body.entry = entry;
          body.txRef = nanoid(10);
          body.instantPricing = entry.instantPricing;

          msg = "Wallet Payment Successfully Processed";
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
        session.startTransaction();

        const newTransaction = new Transaction(body);
        await newTransaction.save({ session });
        await entry.updateOne(
          {
            enterprise: enterprise._id,
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
  changeCard(card, amount) {
    return new Promise(async (resolve, reject) => {
      try {
        const trans = await paystack.transaction.charge({
          reference: nanoid(20),
          authorization_code: card.data.token,
          email: card.data.email,
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
   * @param {Mongo Session} session mongoDB session
   */
  chargeWallet(enterprise, amount, user, session) {
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
          type: "cr",
          user: user.id,
          amount,
          status: "approved",
          enterprise: enterprise._id,
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
}




module.exports = TransactionService;
