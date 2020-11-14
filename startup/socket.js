const app = require("./routes");
const http = require("http").createServer(app);
const redisAdapter = require("socket.io-redis");
const { SocketAuth } = require("../middlewares/auth");
const { SERVER_EVENTS } = require("../constant/events");
const { Entry } = require("../models/entry")
const handler = require("../socket");
const io = require("socket.io")(http, {
  path: "/sio",
  transports: ["websocket"],
});
io.adapter(redisAdapter({ host: "localhost", port: 6379 }));



// const entryChangeStream = Entry.watch();

// const options = { fullDocument: "updateLookup" };
// entryChangeStream.on(
//   "change",
//   (change) => {
//     console.log(change); // You could parse out the needed info and send only that data.
//     io.emit(SERVER_EVENTS.NEW_ENTRY, change);
//   },
//   options
// ); 

io.use(SocketAuth);
io.on(SERVER_EVENTS.CONNECTION, async (socket) => {
  console.log("socket.user", socket.user);
  console.log("socket.io connection");
  // handler.entry.pool(socket);
  socket.emit(SERVER_EVENTS.LISTEN_POOL, await handler.entry.pool(socket));
});





module.exports = {
  io,
  http,
  app,
};
