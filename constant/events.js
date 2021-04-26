const config = require("config");

const REDIS_CONFIG = Object.freeze({
  host: config.get("redis.host"),
  port: config.get("redis.port")
});

const SERVER_EVENTS = Object.freeze({
  // connect to socket
  CONNECTION: "connection",

  // listen for approve entry with payment verified by a company
  LISTEN_POOL: "listenPool",

  // listen to pool for admin
  LISTEN_POOL_ADMIN: "listenPoolAdmin",

  // listen to pool for admin
  LISTEN_POOL_UPDATE_ADMIN: "listenPoolUpdateAdmin",

  // when payment has been approved for an order
  NEW_ENTRY: "newEntry",

  // new orders ADMIN
  NEW_ENTRY_ADMIN: "newEntryAdmin",

  // When a company has accepted the order
  ENTRY_ACCEPTED: "entryAccepted",

  // When an order is assgned to a rider
  ASSIGN_ENTRY: "assignEntry",

  // When an order as been accepted by a rider.
  // we dispatch this to the app to hide that order
  TAKEN_ENTRY: "takenEntry",

  // Updates an entry's data on the admin dashboard
  UPDATE_ENTRY_ADMIN: "updateEntryAdmin",

  // When a rider arrives at pickup/confirms cash payment on pickup
  // we dispatch this to enable the "confirm entry pickup" button on enterprise
  UPDATE_ENTERPRISE_ENTRY: "updateEnterpriseEntry",

  // Updates a rider's basket on the rider app
  ENTRY_PICKUP_CONFIRMED: "entryPickupConfirmed"
});

const CLIENT_EVENTS = Object.freeze({
  // get pool details
  CONNECT: "connect",

  // fired from the client to get chat history
  LISTEN_POOL_ADMIN_HISTORY: "listenPoolAdminHistory",

  // fired from the client to get chat history
  LISTEN_POOL_HISTORY: "listenPoolHistory",
});

module.exports = {
  SERVER_EVENTS,
  CLIENT_EVENTS,
  REDIS_CONFIG,
};