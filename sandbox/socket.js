const app = require("./routes");
const http = require("http").createServer(app);
const Redis = require("ioredis");
const redisAdapter = require("socket.io-redis");
const { SocketAuth } = require("../middlewares/auth");
const { SERVER_EVENTS } = require("../constant/events");
// const EntryModel = require("../models/entry");
// const handler = require("../socket");
// io.adapter(redisAdapter({ host: "127.0.0.1", port: 6379 }));
const io = require("socket.io")(http, {
  path: "/sio",
  transports: ["websocket"],
});

const startupNodes = [
  {
    port: 6380,
    host: "127.0.0.1",
  },
  {
    port: 6381,
    host: "127.0.0.1",
  },
];

io.adapter(
  redisAdapter({
    pubClient: new Redis.Cluster(startupNodes),
    subClient: new Redis.Cluster(startupNodes),
  })
);

// const filter = [
//   {
//     $match: {
//       $and: [
//         { "updateDescription.updatedFields.status": { $exists: true } },
//         { operationType: "update" },
//       ],
//     },
//   },
//   {
//     $project: {
//       "fullDocument.metaData": 0,
//     },
//   },
// ];
// const options = { fullDocument: "updateLookup" };
// const entryCS = EntryModel.watch(filter, options);


// entryCS.on("change", (change) => {
//   console.log(change); // You could parse out the needed info and send only that data.
//   if (change.operationType === "update") {
//     if (change.updateDescription.updatedFields.status === "pending") {
//       io.emit(SERVER_EVENTS.NEW_ENTRY, change.fullDocument);
//     } else if (change.updateDescription.updatedFields.status === "companyAccepted") {
//       io.emit(SERVER_EVENTS.ENTRY_ACCEPTED, change.fullDocument);
//     }
//   }
// });


io.use(SocketAuth);
io.on(SERVER_EVENTS.CONNECTION, async (socket) => {
  console.log("socket.io connection");
  // socket.emit(SERVER_EVENTS.LISTEN_POOL, await handler.entry.pool(socket));
});


module.exports = {
  io,
  http,
  app,
};
