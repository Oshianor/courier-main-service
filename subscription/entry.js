const config = require("config");
const io = require("socket.io-emitter");
const Entry = require("../models/entry")
const Order = require("../models/order")
const Company = require("../models/company");
const RiderEntryRequest = require("../models/riderEntryRequest");
const Rider = require("../models/rider");
const Transaction = require("../models/transaction");
const User = require("../models/users");
const { SocketResponse } = require("../lib/apiResponse");
const { SERVER_EVENTS } = require("../constant/events");
const socket = new io(config.get("application.redis"), { key: "/sio" });


class EntrySubscription {
  /**
   * Get All the admin
   * @param {String} entryId
   */
  newEntry(entryId) {
    return new Promise(async (resolve, reject) => {
      const entry = await Entry.findOne(entryId)
        .populate("transaction")
        .populate("orders")
        .populate("user", "name email phoneNumber countryCode")
        .populate(
          "company",
          "name email phoneNumber type logo address countryCode"
        )
        .populate(
          "rider",
          "name email phoneNumber countryCode onlineStatus latitude longitude"
        );

      socket
        .to("admin")
        .emit(
          SERVER_EVENTS.NEW_ENTRY_ADMIN,
          SocketResponse(false, "ok", entry)
        );
      
      resolve(SocketResponse(false, "ok", entry));
    });
  }

  /**
   * Send pool via socket to all companies
   * @param {Socket Pointer} socket
   */
  getPoolAdmin(socket) {
    return new Promise(async (resolve, reject) => {
      const entries = await Entry.find()
        .select("-metaData")
        .populate("transaction")
        .populate("orders")
        .populate("user", "name email phoneNumber countryCode")
        .populate(
          "company",
          "name email phoneNumber type logo address countryCode"
        )
        .populate(
          "rider",
          "name email phoneNumber countryCode onlineStatus latitude longitude"
        );
      const total = await Entry.find().countDocuments();

      const meta = {
        total,
        pagination: {
          page: 1,
          pageSize: 10,
        },
      };
      resolve(SocketResponse(false, "ok", entries, meta));
    });
  }

  /**
   * Send pool via socket to all companies
   * @param {Socket Pointer} socket
   */
  getPoolAdminHistory(socket, data) {
    return new Promise(async (resolve, reject) => {
      const page = data.page ?? 1;
      const pageSize = data.pageSize ?? 10;
      const skip = (page - 1) * pageSize

      const entries = await Entry.find()
        .select("-metaData")
        .limit(pageSize)
        .skip(skip)
        .populate("transaction")
        .populate("orders")
        .populate("user", "name email phoneNumber countryCode")
        .populate(
          "company",
          "name email phoneNumber type logo address countryCode"
        )
        .populate(
          "rider",
          "name email phoneNumber countryCode onlineStatus latitude longitude"
        );

      const total = await Entry.find().countDocuments();
      
      const meta = {
        total,
        pagination: {
          page: page,
          pageSize
        },
      };

      socket
        .to("admin")
        .emit(
          SERVER_EVENTS.LISTEN_POOL_ADMIN,
          SocketResponse(false, "ok", entries, meta)
        );

      resolve(SocketResponse(false, "ok", entries, meta));
    });
  }

  /**
   * Send pool via socket to all companies
   * @param {Socket Pointer} socket
   */
  getPool(socket) {
    return new Promise(async (resolve, reject) => {
      // validate country
      if (socket.user.type !== "company") {
        reject(SocketResponse(true, "Company Socket"));
        return;
      }

      const company = await Company.findOne({
        _id: socket.user.id,
        $or: [{ status: "active" }, { status: "inactive" }],
        verified: true,
      });

      if (!company) {
        reject(SocketResponse(true, "Company Account Not Found"));
        return;
      }

      const entries = await Entry.find({
        sourceRef: "pool",
        status: "pending",
        state: company.state,
        company: null,
      }).select("-metaData");

      resolve(SocketResponse(false, "ok", entries));
    });
  }

  /**
   * Send pool via socket to a single driver
   * @param {Socket Pointer} socket
   */
  getAssignEntry(socket) {
    return new Promise(async (resolve, reject) => {
      const riderER = await RiderEntryRequest.findOne({
        rider: socket.user.id,
        status: "pending",
      });

      if (!riderER) {
        resolve(SocketResponse(true, "No New request"));
        return;
      }

      const entries = await Entry.findOne({
        status: "companyAccepted",
        _id: riderER.entry,
      })
        .populate("orders")
        .populate("user", "name email phoneNumber countryCode")
        .select("-metaData");

      resolve(SocketResponse(false, "ok", entries));
    });
  }
}

module.exports = EntrySubscription;