const Wallet = require("../models/wallet");
const WalletHistory = require("../models/walletHistory");
const Enterprise = require("../models/enterprise");
const config = require("config");
const paystack = require("paystack")(config.get("paystack.secret"));
const { nanoid } = require("nanoid");
const UserService = require("./user");
const { MSG_TYPES } = require("../constant/types");


class WalletService {
  /**
   * Create a new wallet for enterprise
   * @param {string} enterprise Enterprise Id for the company
   * @param {MongoDb session} session Enterprise Id for the company
   */
  createWallet(enterprise, session) {
    return new Promise(async (resolve, reject) => {
      const newWallet = new Wallet({
        enterprise,
      });

      await newWallet.save({ session });

      resolve(newWallet);
    });
  }

  /**
   * get wallet
   * @param (mongoDb) enterprise Enterprise Id for the company
   */
  getWallet(enterprise) {
    return new Promise(async (resolve, reject) => {
      const wallet = await Wallet.findOne({ enterprise });

      resolve(wallet);
    });
  }

  /**
   * fund wallet with card
   * @param {string} enterprise // Enterprise Id for the company
   */
  fundWallet(body, user, token) {
    return new Promise(async (resolve, reject) => {
      try {
        const wallet = await Wallet.findOne({ enterprise: user.enterprise });

        if (!wallet) {
          return reject({
            code: 400,
            msg: "No wallet was found on your account",
          });
        }

        const userInstance = new UserService();
        const card = await userInstance.getCard(token, body.card);

        const ref = nanoid(20);

        const trans = await paystack.transaction.charge({
          reference: ref,
          authorization_code: card.data.token,
          email: user.email,
          amount: parseFloat(body.amount) * 100,
        });

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

        await wallet.updateOne({
          $inc: { balance: body.amount, totalDeposited: body.amount },
        });

        // add wallet history
        const newWalletHistory = new WalletHistory({
          enterprise: user.enterprise,
          user: user.id,
          txRef: ref,
          amount: body.amount,
          status: "approved",
          type: "credit",
        });

        await newWalletHistory.save();

        resolve({ newWalletHistory, wallet });
      } catch (error) {
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
      }
    });
  }

  /**
   * Admin fund wallet
   * @param {string} enterprise // Enterprise Id for the company
   */
  lineOfCreditForWallet(body, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const enterprise = await Enterprise.findOne({ _id: body.enterprise });
        if (!enterprise) {
          return reject({
            code: 400,
            msg: "No Enterprise account was found",
          });
        }

        const wallet = await Wallet.findOne({ enterprise: body.enterprise });

        if (!wallet) {
          return reject({
            code: 400,
            msg: "No wallet was found for this account",
          });
        }

        await wallet.updateOne({
          $inc: { balance: body.amount, totalCredit: body.amount },
        });

        // add wallet history
        const newWalletHistory = new WalletHistory({
          enterprise: body.enterprise,
          user: enterprise.user,
          txRef: nanoid(20),
          amount: body.amount,
          status: "approved",
          admin: user.id,
          type: "loan",
        });

        await newWalletHistory.save();

        resolve({ newWalletHistory, wallet });
      } catch (error) {
        next(error);
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

        resolve({ total, history })
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = WalletService;
