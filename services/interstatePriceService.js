const mongoose = require("mongoose");
const InterstatePrice = require("../models/interstatePrice");
const InterstateAddress = require("../models/interstateAddress");
const Company = require("../models/company");
const EntryService = require("./entry");
const { AsyncForEach } = require("../utils");
const entryInstance = new EntryService();

class interstatePriceService {

  /**
   * Create interstate for admin
   * @param {*} body
   * @returns
   */
  create = (body) => {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();
      try {
        // start our transaction
        session.startTransaction();

        const checkExist = await InterstatePrice.findOne({
          $and: [
            { originCountry: body.originCountry },
            { originState: body.originState },
            { destinationState: body.destinationState },
            { destinationCountry: body.destinationCountry },
          ],
        }).lean();

        if (body.originCountry !== body.destinationCountry) {
          reject({
            code: 400,
            msg: "country origin and destination must be the same",
          });
        }

        if (checkExist) {
          return reject({
            code: 400,
            msg:
              "Inter state pricing for the specified location already exists",
          });
        }

        body.source = "admin";
        body.currency = "NGN";
        const newISP = new InterstatePrice(body);

        const location = [];
        await AsyncForEach(body.location, async (arr) => {
          console.log("arr", arr);
          const address = await entryInstance.getGooglePlace(arr.address);
          console.log("address", address);
          location.push({
            ...arr,
            address: address[0].formatted_address,
            ...address[0].geometry.location,
            interState: newISP._id,
            state: body.destinationState,
            country: body.destinationCountry,
          });
        });

        await InterstateAddress.create(location, { session });

        await newISP.save({ session });

        await session.commitTransaction();
        session.endSession();

        resolve(newISP);
      } catch (error) {
        console.log("error", error);
        await session.abortTransaction();
        reject(error);
      }
    });
  };

  createCompanyInterstatePrice = (id, body) => {
    return new Promise(async (resolve, reject) => {
      const session = await mongoose.startSession();
      try {
        // start our transaction
        session.startTransaction();
        const getCompanyDetails = await Company.findById({ _id: id });
        const checkExist = await InterstatePrice.findOne({
          $and: [
            { originCountry: getCompanyDetails.country },
            { originState: getCompanyDetails.state },
            { destinationState: body.destinationState },
            { destinationCountry: body.destinationCountry },
            { company: getCompanyDetails._id },
            { organization: getCompanyDetails.organization },
          ],
        }).lean();
        if (getCompanyDetails.country !== body.destinationCountry) {
          reject({
            code: 400,
            msg: "country origin and destination must be the same",
          });
        }
        if (!checkExist) {
          let data = {
            originCountry: getCompanyDetails.country,
            originState: getCompanyDetails.state,
            company: getCompanyDetails._id,
            organization: getCompanyDetails.organization,
          };
          body.currency = "NGN";
          body.source = "company"
          let savedData = Object.assign(body, data);
          // let createData = await InterstatePrice.create(savedData);
          const newISP = new InterstatePrice(savedData);
          const location = [];
          await AsyncForEach(body.location, async (arr) => {
            const address = await entryInstance.getGooglePlace(arr.address);
            location.push({
              ...arr,
              address: address[0].formatted_address,
              ...address[0].geometry.location,
              interState: newISP._id,
              state: body.destinationState,
              country: body.destinationCountry,
            });
          });
          await InterstateAddress.create(location, { session });
          await newISP.save({ session });

          await session.commitTransaction();
          session.endSession();

          resolve(newISP);
        }
        reject({ code: 400, msg: "Company inter state pricing for the specified location already exists" });
      } catch (error) {
        console.log(error, 'error found')
        await session.abortTransaction();
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  getById = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const findData = await InterstatePrice.findById({ _id: id })
          .populate("interStateAddress");

        if (!findData) {
          return reject({ code: 404, msg: "Data not found" });
        }
        resolve(findData);
      } catch (error) {
        console.log(error)
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  getCompanyInterStatePriceById = (companyId, option) => {
    return new Promise(async (resolve, reject) => {
      try {
        const findData = await InterstatePrice.findOne({
          $and: [{ company: companyId }, { _id: option.id }],
        });
        if (!findData) {
          return reject({ code: 404, msg: "Data not found" });
        }
        resolve(findData);
      } catch (error) {
        console.log(error);
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  delete = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deleteData = await InterstatePrice.findByIdAndDelete({ _id: id });
        if (deleteData) {
          resolve(deleteData);
        }
        reject({ code: 404, msg: "Error deleting data" });
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  deleteCompanyInterstatePrice = (companyId, option) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deleteData = await InterstatePrice.findOneAndDelete({
          $and: [{ company: companyId }, { _id: option.id }],
        });
        if (deleteData) {
          resolve(deleteData);
        }
        reject({ code: 404, msg: "Error deleting data" });
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    });
  };

  createInterstateAddress = (options) => {
    return new Promise(async (resolve, reject) => {
      try {
        const checkExist = await InterstateAddress.findOne({ $and: [{ address: options.address }, { name: options.name }, { email: options.email }] });
        if (checkExist) {
          return reject({
            code: 400,
            msg:
              " specified interstate address already exists",
          });
        }
        const address = await entryInstance.getGooglePlace(options.address)
        const Geo = address[0].geometry.location;
        const data = Object.assign(options, Geo)
        const createAddress = await InterstateAddress.create(data)
        resolve(createAddress);
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    })
  }

  createDropoffPrice = (options) => {
    return new Promise(async (resolve, reject) => {
      try {
        let getAddressDetail = await InterstateAddress.findById({ _id: options.interStateAddress });
        const checkExist = await InterstatePrice.findOne({
          $and: [
            { originCountry: options.originCountry },
            { originState: options.originState },
            { destinationState: options.destinationState },
          ],
        })
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
              msg: "destination state does not match with the address you choose",
            });
          }

          options.destinationCountry = getAddressDetail.country
          options.currency = "NGN"
          options.source = "admin"
          options.status = true
          let addDropOffPrice = await InterstatePrice.create(options)
          let dropoffPriceId = addDropOffPrice._id
          let finalDropOff = await InterstatePrice.findById({ _id: dropoffPriceId }, {
            "source": 0, "currency": 0,
            "originCountry": 0, "originState": 0, "destinationState": 0, "destinationCountry": 0, "status": 0, "createdAt": 0, "updatedAt": 0, "__v": 0
          })
            .populate({ path: "interStateAddress", model: 'InterStateAddress' })
          resolve(finalDropOff)
        }

      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    })
  }

  getInterstateAddress = (state) => {
    return new Promise(async (resolve, reject) => {
      try {
        let address = await InterstateAddress.find({ $and: [{ state: { $regex: state, $options: 'i' } }, { status: true }] })
        if (address.length >= 1) {
          resolve(address);
        }
        return reject({
          code: 404,
          msg:
            "No dropoff address for this state at the moment",
        });
      } catch (error) {
        reject({ code: 500, msg: "something went wrong" });
      }
    })
  }


  changeInterstateAddressStatus = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let updateStatus = await InterstateAddress.findByIdAndUpdate({ _id: id }, { status: false })
        resolve(updateStatus);
      } catch (err) {
        reject({ code: 500, msg: "something went wrong" });
      }
    })
  }

  getAllInterstateAddress = (pagesize, pagenumber) => {
    return new Promise(async (resolve, reject) => {
      try {
        let getAddress = await InterstateAddress.find({})
          .skip((parseInt(pagenumber) - 1) * parseInt(pagesize))
          .limit(parseInt(pagesize));
        if (getAddress) {
          resolve(getAddress)
        }
        return reject({
          code: 404,
          msg:
            "No interstate address at the moment",
        });
      } catch (err) {
        reject({ code: 500, msg: "something went wrong" });
      }
    })
  }

  getAllInterstateDropOff = (pagesize, pagenumber) => {
    return new Promise(async (resolve, reject) => {
      try {
        let getDropoffPrice = await InterstatePrice.find({})
          .populate({ path: "interStateAddress", model: 'InterStateAddress' })
          .skip((parseInt(pagenumber) - 1) * parseInt(pagesize))
          .limit(parseInt(pagesize));
        if (getDropoffPrice) {
          resolve(getDropoffPrice)
        }
        return reject({
          code: 404,
          msg:
            "No interstate dropoff price at the moment",
        });
      } catch (error) {
        console.log(error)
        reject({ code: 500, msg: "something went wrong" });
      }
    })
  }
}





module.exports = interstatePriceService;
