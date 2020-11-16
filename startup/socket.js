const app = require("./routes");
const http = require("http").createServer(app);
const redisAdapter = require("socket.io-redis");
const { SocketAuth } = require("../middlewares/auth");
const { SERVER_EVENTS } = require("../constant/events");
const EntryModel = require("../models/entry");
const handler = require("../socket");
const io = require("socket.io")(http, {
  path: "/sio",
  transports: ["websocket"],
});
// io.adapter(redisAdapter({ host: "localhost", port: 6379 }));
io.use(SocketAuth);

console.log("cccc", io.sockets);

const filter = [
  // { $match: { operationType: "update" } },
  {
    $match: {
      $and: [
        { "updateDescription.updatedFields.status": { $exists: true } },
        { operationType: "update" },
      ],
    },
  },
  {
    $project: {
      "fullDocument.metaData": 0,
    },
  },
];
const options = { fullDocument: "updateLookup" };
const entryCS = EntryModel.watch(filter, options);


entryCS.on("change", (change) => {
  console.log(change); // You could parse out the needed info and send only that data.
  if (change.operationType === "update") {
    if (change.updateDescription.updatedFields.status === "pending") {
      io.emit(SERVER_EVENTS.NEW_ENTRY, change.fullDocument);
    } else if (change.updateDescription.updatedFields.status === "companyAccepted") {
      io.emit(SERVER_EVENTS.ENTRY_ACCEPTED, change.fullDocument);
    }
  }
});

io.on(SERVER_EVENTS.CONNECTION, async (socket) => {
  // console.log("socket.user", socket.user);
  console.log("socket.io connection");
  // handler.entry.pool(socket);
  socket.emit(SERVER_EVENTS.LISTEN_POOL, await handler.entry.pool(socket));
});


module.exports = {
  io,
  http,
  app,
};
