const config = require("config");
const io = require("socket.io-emitter");
const { SocketResponse } = require("../lib/apiResponse");
const { SERVER_EVENTS } = require("../constant/events");
const { AsyncForEach } = require("../utils");
const socket = new io(config.get("application.redis"), { key: "/sio" });


class RiderSubscription {
  /**
   * send new entries to multiple riders
   * @param {Array} riderIDS and array of riders id
   * @param {Object} entry the entry to be sent to the riders
   */
  sendRidersEntries(riderIDS, entry) {
    return new Promise(async (resolve, reject) => {
      await AsyncForEach(riderIDS, (row, index, arr) => {
        // send to rider by their room id
        // send socket to riders only
        socket.to(String(row)).emit(SERVER_EVENTS.ASSIGN_ENTRY, entry);
      });
      
      resolve({ entry });

      // resolve(SocketResponse(false, "ok", entry));
    });
  }
}

module.exports = RiderSubscription;