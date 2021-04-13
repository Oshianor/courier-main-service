const mongoose = require("mongoose");
const InterstatePrice = require("../models/interstatePrice");
const InterstateAddress = require("../models/interstateAddress");
const Company = require("../models/company");
const EntryService = require("./entry");
const { AsyncForEach } = require("../utils");
const entryInstance = new EntryService();

class interstatePriceService {
  /**
   * Get address location details
   * @param {ObjectID} id
   * @returns Object
   */
  getById = (locationId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const findData = await InterstatePrice.findById(locationId).populate(
          "interStateAddress"
        );
        if (!findData) {
          return reject({ code: 404, msg: "No Location address was found" });
        }

        resolve(findData);
      } catch (error) {
        reject(error);
      }
    });
  };

  createInterstateAddress = (options) => {
    return new Promise(async (resolve, reject) => {
      try {
        const checkExist = await InterstateAddress.findOne({
          $and: [
            { address: options.address },
            { name: options.name },
            { email: options.email },
          ],
        });
        if (checkExist) {
          return reject({
            code: 400,
            msg: "Specified interstate address already exists",
          });
        }
        const address = await entryInstance.getGooglePlace(options.address);
        const Geo = address[0].geometry.location;
        const data = Object.assign(options, Geo);
        const createAddress = await InterstateAddress.create(data);
        resolve(createAddress);
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  createDropoffPrice = (options) => {
    return new Promise(async (resolve, reject) => {
      try {
        let getAddressDetail = await InterstateAddress.findById({
          _id: options.interStateAddress,
        });
        const checkExist = await InterstatePrice.findOne({
          $and: [
            { originCountry: options.originCountry },
            { originState: options.originState },
            { destinationState: options.interStateAddress },
          ],
        });
        if (checkExist) {
          return reject({
            code: 400,
            msg:
              "Inter state pricing for the specified location already exists",
          });
        } else {
          if (options.originCountry !== getAddressDetail.country) {
            reject({
              code: 400,
              msg: "country origin and destination must be the same",
            });
          }

          if (options.destinationState !== getAddressDetail.state) {
            reject({
              code: 400,
              msg:
                "destination state does not match with the address you choose",
            });
          }

          options.destinationCountry = getAddressDetail.country;
          options.currency = "NGN";
          options.source = "admin";
          options.status = true;
          let addDropOffPrice = await InterstatePrice.create(options);
          let dropoffPriceId = addDropOffPrice._id;
          let finalDropOff = await InterstatePrice.findById(
            { _id: dropoffPriceId },
            {
              source: 0,
              currency: 0,
              originCountry: 0,
              originState: 0,
              destinationState: 0,
              destinationCountry: 0,
              status: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            }
          ).populate({ path: "interStateAddress", model: "InterStateAddress" });
          resolve(finalDropOff);
        }
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  getInterstateAddress = (state) => {
    return new Promise(async (resolve, reject) => {
      try {
        let address = await InterstateAddress.find({
          $and: [{ state: { $regex: state, $options: "i" } }, { status: true }],
        });
        if (address.length >= 1) {
          resolve(address);
        }
        return reject({
          code: 404,
          msg: "No dropoff address for this state at the moment",
        });
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  changeInterstateAddressStatus = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let checkStatus = await InterstateAddress.findOne({ _id: id });
        let updateStatus = await InterstateAddress.findByIdAndUpdate(
          { _id: id },
          { status: checkStatus.status === false ? true : false }
        );
        resolve(updateStatus);
      } catch (err) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  getAllInterstateAddress = (pageSize, page, skip) => {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await InterstateAddress.find({}).skip(skip).limit(pageSize);

        const total = await InterstateAddress.countDocuments();

        resolve({ data, total });
      } catch (err) {
        reject(error);
      }
    });
  };

  getAllInterstateDropOff = (pageSize, page, skip) => {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await InterstatePrice.find({})
          .populate({ path: "interStateAddress", model: "InterStateAddress" })
          .skip(skip)
          .limit(pageSize);

        const total = await InterstatePrice.countDocuments();

        resolve({ data, total });
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  };

  deleteInterstateAddress = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let priceId = await InterstatePrice.findOne({ interStateAddress: id });
        if (priceId) {
          let dropOffPrice = priceId._id;
          await InterstatePrice.findByIdAndRemove({ _id: dropOffPrice });
          const deleteData = await InterstateAddress.findByIdAndRemove({
            _id: id,
          });
          resolve(deleteData);
        }
        const deleteData = await InterstateAddress.findByIdAndRemove({
          _id: id,
        });
        resolve(deleteData);
      } catch (error) {
        reject(error);
      }
    });
  };

  deleteInterstateDropOffPrice = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let findPrice = await InterstatePrice.findById({ _id: id });
        let PriceAddress = findPrice.interStateAddress;
        await InterstateAddress.findByIdAndRemove({ _id: PriceAddress });
        const deleteData = await InterstatePrice.findByIdAndRemove({ _id: id });
        resolve(deleteData);
      } catch (error) {
        reject(error);
      }
    });
  };

  updateInterstateAddress = (id, options) => {
    return new Promise(async (resolve, reject) => {
      try {
        const checkExist = await InterstateAddress.findOne({ _id: id });
        if (!checkExist) {
          return reject({
            code: 400,
            msg: "Specified interstate address does not exists",
          });
        }
        const address = await entryInstance.getGooglePlace(options.address);
        const Geo = address[0].geometry.location;
        const data = Object.assign(options, Geo);
        let updateAddress = await InterstateAddress.findByIdAndUpdate(
          { _id: id },
          data
        );
        resolve(updateAddress);
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  updateDropOffPrice = (id, options) => {
    return new Promise(async (resolve, reject) => {
      try {
        const checkExist = await InterstatePrice.findOne({ _id: id });
        if (!checkExist) {
          return reject({
            code: 400,
            msg:
              "Inter state pricing for the specified location does not exists",
          });
        } else {
          let price = { price: options.price };
          await InterstatePrice.findByIdAndUpdate({ _id: id }, price);
          let getEditedDropOff = await InterstatePrice.findById(
            { _id: id },
            {
              source: 0,
              currency: 0,
              originCountry: 0,
              originState: 0,
              destinationState: 0,
              destinationCountry: 0,
              status: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            }
          ).populate({ path: "interStateAddress", model: "InterStateAddress" });
          resolve(getEditedDropOff);
        }
      } catch (err) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };
}


module.exports = interstatePriceService;
