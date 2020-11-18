const SERVER_EVENTS = Object.freeze({
  // connect to socket
  CONNECTION: "connection",

  // listen for approve entry with payment verified by a company
  LISTEN_POOL: "listenPool",

  // listen to pool for admin
  LISTEN_POOL_ADMIN: "listenPoolAdmin",

  // when payment has been approved for an order
  NEW_ENTRY: "newEntry",

  // new orders ADMIN
  NEW_ENTRY_ADMIN: "newEntryAdmin",

  // When a company has accepted the order
  ENTRY_ACCEPTED: "entryAccepted",

  // When an order is assgned to a rider
  ASSIGN_ENTRY: "assignEntry",

  // driver location in realtime
  DRIVER_LOCATION: "driverLocation",
});


const CLIENT_EVENTS = Object.freeze({
  // get pool details
  CONNECT: "connect",
});

module.exports = {
  SERVER_EVENTS,
  CLIENT_EVENTS,
}; 