const riderBank = require('../models/riderBank');
const { MSG_TYPES } = require('../constant/types');
const axios = require("axios");
const config = require("config");

class BankDetailService {

  /**
   * Create bank detail for a rider
   * @param {Object} body
  */
  static create(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const existingBankDetails = await riderBank.find({ rider: body.rider, accountNumber: body.accountNumber })
        if (existingBankDetails.length > 0) {
          reject({ statusCode: 400, msg: "Bank Detail Exists" })
          return
        }
        const createBank = await riderBank.create(body)
        resolve(createBank)
      } catch (error) {
        reject({ statusCode: error.code, msg: error.msg });
        return
      }
    })
  }

  /**
   * Get all bank details for a rider
   * @param {MongoDB ObjectId} rider
   * @param {number} skip
   * @param {number} pageSize
  */
  static getAllBankDetails(rider, skip, pageSize) {
    return new Promise(async (resolve, reject) => {
      try {
        const bankDetails = await riderBank.find({ rider })
          .skip(skip)
          .limit(pageSize)

        const total = await riderBank.find({ rider }).countDocuments()

        resolve({ bankDetails, total })
      } catch (error) {
        console.log(error);
        reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR });
        return
      }
    })
  }

  /**
   * get default bank detail for a rider
   * @param {MongoDB ObjectId} user
  */
  static getDefault(rider) {
    return new Promise(async (resolve, reject) => {
      try {
        const bankDetail = await riderBank.findOne({
          rider,
          default: true
        })

        if (!bankDetail) {
          reject({ statusCode: 404, msg: MSG_TYPES.NOT_FOUND });
          return
        }
        resolve(bankDetail)
      } catch (error) {
        reject({ statusCode: 500, msg: MSG_TYPES.SERVER_ERROR })
        return
      }
    })
  }

  /**
   * set default bank detail for a rider
   * @param {Request Object} req
  */
  static setDefault(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let existingDefault = await riderBank.findOne({
          rider: req.user.id,
          default: true
        })

        if (existingDefault) {
          if (existingDefault._id == req.body.riderBankId) {
            reject({ statusCode: 400, msg: "Bank already your default bank" });
            return
          }
          await riderBank.updateOne(
            { _id: existingDefault._id },
            {
              $set: { default: false, }
            }
          )
        }
        const defaultBank = await riderBank.updateOne(
          { _id: req.body.riderBankId },
          {
            $set: { default: true }
          }
        )

        resolve(defaultBank)
      } catch (error) {
        reject({ statusCode: 404, msg: MSG_TYPES.SERVER_ERROR })
        return
      }
    })
  }
  /**
   * delete Bank detail for a rider
   * @param {Request Object} req
  */
  static removeBank(req) {
    new Promise(async (resolve, reject) => {
      try {
        const bank = await riderBank.findOne({
          _id: req.body.riderBankId,
          rider: req.user.id
        })
        if (!bank) {
          return reject({ statusCode: 404, msg: MSG_TYPES.NOT_FOUND });
        }
        await bank.delete();
        resolve({ statusCode: 200, msg: MSG_TYPES.DELETED })
      } catch (error) {
        // throw error
        reject({ statusCode: 404, msg: MSG_TYPES.SERVER_ERROR })
        return
      }
    })
  }

  /**
   * List available banks from paystack
  */
  static listBanks() {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(`https://api.paystack.co/bank?perPage=500`, {
          headers: {
            'Authorization': `Bearer ${config.get("paystack.secret")}`
          }
        });
        if (response.status === 200) {
          resolve(response.data.data);
        } else {
          reject({ statusCode: response.status, msg: MSG_TYPES.SERVER_ERROR });
        }
      } catch (error) {
        reject({ statusCode: 404, msg: MSG_TYPES.SERVER_ERROR, error });
      }
    })
  }

  /**
   * Resolve bank details from paystack
  */
  static resolveAccount({ accountNumber, bankCode }) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
          headers: {
            'Authorization': `Bearer ${config.get("paystack.secret")}`
          }
        });
        if (response.status === 200) {
          resolve(response.data.data);
        } else {
          reject({ statusCode: 404, msg: MSG_TYPES.NOT_FOUND });
        }
      } catch (error) {
        reject({ statusCode: 404, msg: MSG_TYPES.NOT_FOUND, error });
      }
    })
  }
}


module.exports = BankDetailService