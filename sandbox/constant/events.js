const SERVER_EVENTS = Object.freeze({
  // connect to socket
  CONNECTION: "connection",

  LISTEN_POOL: "listenPool",

  // when payment has been approved for an order
  NEW_ENTRY: "newEntry",

  // When a company has accepted the order
  ENTRY_ACCEPTED: "entryAccepted",
});


const CLIENT_EVENTS = Object.freeze({
  // get pool details
  CONNECT: "connect",
});

module.exports = {
  SERVER_EVENTS,
  CLIENT_EVENTS,
}; 