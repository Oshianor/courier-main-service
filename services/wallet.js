const Wallet = require("../models/wallet");
const WalletHistory = require("../models/walletHistory");
const config = require("config");
const paystack = require("paystack")(config.get("paystack.secret"));
const { nanoid } = require("nanoid");
const UserService = require("./user");
const { MSG_TYPES } = require("../constant/types");


class WalletService {
  /**
   * Create a new wallet for enterprise
   * @param {string} enterprise // Enterprise Id for the company
   */
  createWallet(enterprise) {
    return new Promise(async (resolve, reject) => {
      const newWallet = new Wallet({
        enterprise,
      });

      resolve(newWallet);
    });
  }

  /**
   * fund wallet with card
   * @param {string} enterprise // Enterprise Id for the company
   */
  fundWallet(body, user, token) {
    return new Promise(async (resolve, reject) => {
      try {
        const userInstance = new UserService();
        const card = await userInstance.getCard(token, body.card);

        const ref = nanoid(20);

        const trans = await paystack.transaction.charge({
          reference: ref,
          authorization_code: card.data.token,
          email: user.email,
          amount: body.amount,
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

        const wallet = await Wallet.findOne({ enterprise: user.enterprise });

        if (!wallet) return reject({ code: 400, msg: "No wallet was found on your account" });

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
        });

        resolve({ newWalletHistory, wallet });
      } catch (error) {
        reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR })
      }
    });
  }
}

module.exports = WalletService;
