const config = require("config");
const io = require("socket.io-emitter");
const { SocketResponse } = require("../lib/apiResponse");
const { SERVER_EVENTS } = require("../constant/events");
const { AsyncForEach } = require("../utils");
const socket = new io(config.get("application.redis"), { key: "/sio" });


class CompanySubscription {
  /**
   * dispatch an socket to companies to remove the accepted entries
   * @param {String} entryId Entry id
   */
  dispatchAcceptedEntry(entry) {
    return new Promise(async (resolve, reject) => {
      socket.emit(SERVER_EVENTS.ENTRY_ACCEPTED, { entry });
      resolve({ entry });
    });
  }

  /**
   * dispatch to entries to a group of state for the company
   * @param {Object} entry Entry
   */
  dispatchToStateRoom(entry) {
    return new Promise(async (resolve, reject) => {
      socket.to(String(entry.state)).emit(SERVER_EVENTS.NEW_ENTRY, entry);
      resolve({ entry });
    });
  }
}

module.exports = CompanySubscription;