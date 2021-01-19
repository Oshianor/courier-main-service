const config = require("config");
const io = require("socket.io-emitter");
const { SocketResponse } = require("../lib/apiResponse");
const { SERVER_EVENTS } = require("../constant/events");
const { AsyncForEach } = require("../utils");
const RiderEntryRequest = require("../models/riderEntryRequest");
const socket = new io(config.get("application.redis"), { key: "/sio" });

class RiderSubscription {
  /**
   * send new entries to multiple riders
   * @param {Array} riderIDS and array of riders id
   * @param {Object} entry the entry to be sent to the riders
   */
  sendRidersEntries(riderIDS, entry) {
    return new Promise(async (resolve, reject) => {
      // send to an array of riders
      await AsyncForEach(riderIDS, (row, index, arr) => {
        // send to rider by their room id
        // send socket to riders only
        socket
          .to(String(row))
          .emit(SERVER_EVENTS.ASSIGN_ENTRY, SocketResponse(false, "ok", entry));
      });

      resolve({ entry });
    });
  }

  /**
   * Dispatch action to riders that entry has been taken.
   * @param {ObjectId} entry
   */
  takenEntryForRiders(entry) {
    return new Promise(async (resolve, reject) => {

      console.log("entry", entry);
      const request = await RiderEntryRequest.find({ entry });

      console.log("request", request);
      
      // send to an array of riders
      await AsyncForEach(request, (row, index, arr) => {

        console.log("row", row);

        // send to rider by their room id
        // send socket to riders only
        socket.to(String(row.rider)).emit(SERVER_EVENTS.TAKEN_ENTRY, SocketResponse(false, "ok", null));
      });

      resolve();
    });
  }
}

module.exports = RiderSubscription;