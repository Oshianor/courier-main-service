const Wallet = require("../models/wallet");
const WalletHistory = require("../models/walletHistory");
// const Enterprise = require("../models/enterprise");
const config = require("config");
const paystack = require("paystack")(config.get("paystack.secret"));
const { nanoid } = require("nanoid");
const UserService = require("./user");
const { MSG_TYPES } = require("../constant/types");
const { populateMultiple } = require("../services/aggregate")
const CardService = require("./card");
const cardInstance = new CardService();


class WalletService {
  /**
   * Create a new wallet for enterprise
   * @param {string} enterprise Enterprise Id for the company
   * @param {MongoDb session} session Enterprise Id for the company
   */
  createWallet(enterprise) {
    return new Promise(async (resolve, reject) => {
      const newWallet = new Wallet({
        enterprise,
      });

      await newWallet.save();

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
   * get all wallet
   * @param {number} skip
   * @param {number} pageSize
   */
  getAllWallet(skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      let wallet = await Wallet.find()
        // .populate(
        //   "enterprise",
        //   "name email address industry countryCode phoneNumber type"
        // )
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .lean();

        wallet = await populateMultiple(wallet, "enterprise");

      const total = await Wallet.find().countDocuments();

      resolve({ wallet, total });
    });
  }

  /**
   * fund wallet with card
   * @param {string} enterprise // Enterprise Id for the company
   */
  fundWallet(body, user, token) {
    return new Promise(async (resolve, reject) => {
      try {
        const wallet = await Wallet.findOne({
          enterprise: user.enterprise,
        });

        if (!wallet) {
          return reject({
            code: 400,
            msg: "No wallet was found on your account",
          });
        }

        if (wallet.status === "suspended") {
          return reject({
            code: 400,
            msg:
              "Your wallet account has been suspended. Please contact support for asistance",
          });
        }

        
        const card = await cardInstance.get({ _id: body.card, user: user.id });

        const ref = nanoid(20);

        const trans = await paystack.transaction.charge({
          reference: ref,
          authorization_code: card.token,
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
          wallet: wallet._id
        });

        await newWalletHistory.save();

        resolve({ newWalletHistory, wallet });
      } catch (error) {
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
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
   * Suspended a wallet screen
   * @param {Object} body
   */
  disableAWallet(params) {
    return new Promise(async (resolve, reject) => {
      try {
        const wallet = await Wallet.findOne({
          _id: params.wallet,
        });

        if (!wallet) {
          return reject({ code: 404, msg: "No wallet was found." });
        }

        (wallet.status = wallet.status === "active" ? "suspended" : "active"),
          await wallet.save();

        resolve(wallet);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * get Wallet history by wallet ID for admin
   * @param {Object} params request parameters
   * @param {number} skip
   * @param {number} pageSize
   */
  singleWalletHistory(params, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const history = await WalletHistory.find({
          wallet: params.wallet,
        })
          .skip(skip)
          .limit(pageSize)
          .sort({ createdAt: -1 });

        const total = await WalletHistory.find({
          wallet: params.wallet,
        }).countDocuments();

        resolve({ total, history });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = WalletService;
