const io = require("socket.io-emitter");
const Entry = require("../models/entry");
const Company = require("../models/company");
const RiderEntryRequest = require("../models/riderEntryRequest");
const { SocketResponse } = require("../lib/apiResponse");
const { SERVER_EVENTS, REDIS_CONFIG } = require("../constant/events");
const { populateSingle, populateMultiple } = require("../services/aggregate");
const socket = new io(REDIS_CONFIG, { key: "/sio" });

class EntrySubscription {
  /**
   * Get All the admin
   * @param {String} entryId
   */
  getEntry(entryId) {
    return new Promise(async (resolve, reject) => {
      let entry = await Entry.findOne(entryId)
        .populate("transaction")
        .populate("orders")
        .populate("vehicle")
        .populate(
          "company",
          "name email phoneNumber type logo address countryCode"
        )
        .populate(
          "rider",
          "name email phoneNumber countryCode onlineStatus latitude longitude img"
        )
        .lean();

      entry = await populateSingle(
        entry,
        "user",
        "name email phoneNumber countryCode img"
      );

      resolve(entry);
    });
  }

  newEntry(entryId) {
    return new Promise(async (resolve, reject) => {
      const entry = await this.getEntry(entryId);

      socket
        .to("admin")
        .emit(
          SERVER_EVENTS.NEW_ENTRY_ADMIN,
          SocketResponse(false, "ok", entry)
        );

      resolve(SocketResponse(false, "ok", entry));
    });
  }

  updateEntry(entryId) {
    return new Promise(async (resolve, reject) => {
      const entry = await this.getEntry(entryId);

      socket
        .to("admin")
        .emit(
          SERVER_EVENTS.UPDATE_ENTRY_ADMIN,
          SocketResponse(false, "ok", entry)
        );

      resolve(SocketResponse(false, "ok", entry));
    });
  }

  /**
   * Send pool via socket to all companies
   * @param {Socket Pointer} socket
   */
  getPoolAdmin() {
    return new Promise(async (resolve, reject) => {
      let entries = await Entry.find()
        .lean()
        .limit(10)
        .select("-metaData")
        .populate("transaction")
        .populate("orders")
        .populate("vehicle")
        .populate(
          "company",
          "name email phoneNumber type logo address countryCode"
        )
        .populate(
          "rider",
          "name email phoneNumber countryCode onlineStatus latitude longitude img"
        )
        .sort({ updatedAt: -1 });

      entries = await populateMultiple(
        entries,
        "user",
        "name email phoneNumber countryCode img"
      );
      const total = await Entry.countDocuments();

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
      const skip = (page - 1) * pageSize;

      let entries = await Entry.find()
        .select("-metaData")
        .limit(pageSize)
        .skip(skip)
        .populate("transaction")
        .populate("orders")
        .populate("vehicle")
        // .populate("user", "name email phoneNumber countryCode")
        .populate(
          "company",
          "name email phoneNumber type logo address countryCode"
        )
        .populate(
          "rider",
          "name email phoneNumber countryCode onlineStatus latitude longitude img"
        )
        .sort({ updatedAt: -1 })
        .lean();

      entries = await populateMultiple(
        entries,
        "user",
        "name email phoneNumber countryCode img"
      );

      const total = await Entry.find().countDocuments();

      const meta = {
        total,
        pagination: {
          page: page,
          pageSize,
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
      })
        .populate("vehicle")
        .select("-metaData")
        .sort({ approvedAt: -1 });

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
        reject(SocketResponse(true, "No New request"));
        return;
      }

      let entry = await Entry.findOne({
        status: "companyAccepted",
        _id: riderER.entry,
      })
        .lean()
        .populate("orders")
        .select("-metaData");

      if (entry) {
        entry = await populateSingle(
          entry,
          "user",
          "name email phoneNumber img"
        );
      }
      resolve(SocketResponse(false, "ok", entry));
    });
  }

  updateEntryAdmin(entryId) {
    return new Promise(async (resolve, reject) => {
      const entry = await this.getEntry(entryId);
      // let entry = await Entry.findById(entryId)
      //   .populate("transaction")
      //   .populate("orders")
      //   .populate(
      //     "company",
      //     "name email phoneNumber type logo address countryCode"
      //   )
      //   .populate(
      //     "rider",
      //     "name email phoneNumber countryCode onlineStatus latitude longitude img"
      //   )
      //   .lean();

      // entry = await populateSingle(entry, "user", "name email phoneNumber countryCode img");

      socket
        .to("admin")
        .emit(
          SERVER_EVENTS.LISTEN_POOL_UPDATE_ADMIN,
          SocketResponse(false, "ok", entry)
        );

      resolve(entry);
    });
  }
}

module.exports = EntrySubscription;
