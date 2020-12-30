const Company = require("../models/company");
const Card = require("../models/card");
const config = require("config");
const paystack = require("paystack")(config.get("paystack.secret"));
const { MSG_TYPES } = require("../constant/types");
const { Mongoose } = require("mongoose");


class CardService {
  /**
   * Add Card to company account
   * @param {Object} body request body object
   */
  addCard(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = await paystack.transaction.verify(body.txRef);
        if (!transaction.status) {
          reject({ code: 400, msg: "Error processing payment" });
          return;
        }
        if (transaction.data.status !== "success") {
          reject({ code: 400, msg: MSG_TYPES.SERVER_ERROR });
          return;
        }

        const company = await Company.findById(body.company);

        // if (transaction.data.customer.email !== company.email) {
        //   reject({ code: 400, msg: "This transaction email doesn't match your account email." });
        //   return;
        // }

        const trans = transaction.data.authorization;
        if (!trans.reusable) {
          reject({
            code: 400,
            msg: "This card cannot be reused for future transaction.",
          });
          return;
        }

        const card = await Card.findOne({
          company: body.company,
          last4: trans.last4,
        });

        if (card) {
          reject({ code: 500, msg: "Card already exist" });
          return
        }

        const newCard = new Card({
          token: trans.authorization_code,
          last4: trans.last4,
          bin: trans.bin,
          expMonth: trans.exp_month,
          expYear: trans.exp_year,
          bank: trans.bank,
          brand: trans.brand,
          company: body.company,
          txRef: body.txRef,
          accountName: trans.account_name ? trans.account_name : company.name,
        });

        await newCard.save();
        resolve({ newCard });
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return
      }
    });
  }

  /**
   * Get my cards
   * @param {Object} body request body object
  */
  getAll(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const cards = await Card.find({ company: body.company })
        if (cards.length < 1) return reject({ statusCode: 400, msg: "No Cards Found" })
        resolve(cards)
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return
      }
    })
  }

  /**
   * Get a single card
   * @param {Mongoose objectId} cardId card _id
  */
  get(cardId) {
    return new Promise(async (resolve, reject) => {
      try {
        const card = await Card.findById(cardId)
        if (!card) return reject({ statusCode: 400, msg: MSG_TYPES.NOT_FOUND })
        resolve(card)
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return
      }
    })
  }

  /**
 * Remove a card
 * @param {Mongoose objectId} cardId card _id
*/
  delete(cardId) {
    return new Promise(async (resolve, reject) => {
      try {
        const card = await Card.deleteOne({ _id: cardId })
        if (!card) return reject({ statusCode: 400, msg: MSG_TYPES.NOT_FOUND })
        resolve(card)
      } catch (error) {
        reject({ code: error.code, msg: error.msg });
        return
      }
    })
  }
}

module.exports = CardService;