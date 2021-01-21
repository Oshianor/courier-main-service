const Credit = require("../models/credit");
const CreditHistory = require("../models/creditHistory");
const Enterprise = require("../models/enterprise");
const config = require("config");
const paystack = require("paystack")(config.get("paystack.secret"));
const { nanoid } = require("nanoid");
const UserService = require("./user");
const { MSG_TYPES } = require("../constant/types");


class CreditService {
  /**
   * Create a new credit for enterprise
   * @param {string} enterprise Enterprise Id for the company
   * @param {MongoDb session} session Enterprise Id for the company
   */
  createCredit(enterprise, session) {
    return new Promise(async (resolve, reject) => {
      const newCredit = new Credit({
        enterprise,
      });

      await newCredit.save({ session });

      resolve(newCredit);
    });
  }

  /**
   * get line of credit
   * @param (mongoDb) enterprise Enterprise Id for the company
   */
  getCredit(enterprise) {
    return new Promise(async (resolve, reject) => {
      const credit = await Credit.findOne({ enterprise });

      resolve(credit);
    });
  }

  /**
   * Admin fund wallet
   * @param {string} enterprise Enterprise Id for the company
   */
  assignCredit(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const enterprise = await Enterprise.findOne({ _id: body.enterprise });
        if (!enterprise) {
          return reject({
            code: 400,
            msg: "No Enterprise account was found",
          });
        }

        const credit = await Credit.findOne({ enterprise: body.enterprise });

        if (!credit) {
          return reject({
            code: 400,
            msg: "No Credit account found",
          });
        }

        await credit.updateOne({
          $inc: { balance: body.amount, totalCredit: body.amount },
        });

        // add wallet history
        const newCreditHistory = new CreditHistory({
          enterprise: body.enterprise,
          user: enterprise.user,
          txRef: nanoid(20),
          amount: body.amount,
          status: "approved",
          admin: user.id,
          type: "loan",
        });

        await newCreditHistory.save();

        resolve({ newCreditHistory, credit });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * get Wallet history
   * @param {Object} enterprise Enterprise Id for the company
   */
  walletHistory(user, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const history = await WalletHistory.find({
          enterprise: user.enterprise,
        })
          .skip(skip)
          .limit(pageSize)
          .sort({ createdAt: -1 });

        const total = await WalletHistory.find({
          enterprise: user.enterprise,
        }).countDocuments();

        resolve({ total, history });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all credit accounts
   * @param {number} skip
   * @param {number} pageSize
   */
  getAllCredit(skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      const credit = await CreditHistory.find({ type: "loan" }).skip(skip).limit(pageSize).populate("enterprise", "name email countryCode phoneNumber");

      const total = await CreditHistory.countDocuments({ type: "loan" });

      resolve({ credit, total });
    });
  }

  /**
   * request loan from admin
   * @param {string} enterprise Enterprise Id for the company
   */
  requestCredit(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        // add wallet history
        const newCreditHistory = new CreditHistory({
          enterprise: user.enterprise,
          user: user.id,
          txRef: nanoid(10),
          amount: body.amount,
          status: "pending",
          admin: null,
          type: "loan",
          approvedAt: null,
        });

        await newCreditHistory.save();

        resolve({ newCreditHistory });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Approve loan request
   * @param {string} enterprise Enterprise Id for the company
   */
  approveCredit(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const creditHistory = await CreditHistory.findOne({ _id: body.credit, status: "pending" });
        if (!creditHistory) {
          return reject({
            code: 400,
            msg: "No Credit request was found",
          });
        }

        if (body.status === "approved") {
          await creditHistory.updateOne({
            status: "approved",
            admin: user.id,
            approvedAt: new Date(),
          });
          await Credit.updateOne(
            { enterprise: creditHistory.enterprise },
            { $inc: { balance: creditHistory.amount, totalCredit: creditHistory.amount } }
          );

          return resolve({ creditHistory });

        }
          
        await creditHistory.updateOne({ status: "declined" });
        return resolve({ creditHistory });
      } catch (error) {
        reject(error);
      }
    });
  }


}

module.exports = CreditService;
