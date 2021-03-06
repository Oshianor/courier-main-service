const app = require("./routes");
const http = require("http").createServer(app);
const EntrySubscription = require("../subscription/entry");
const redisAdapter = require("socket.io-redis");
const { SocketAuth } = require("../middlewares/auth");
const { SERVER_EVENTS, CLIENT_EVENTS, REDIS_CONFIG } = require("../constant/events");
const io = require("socket.io")(http, {
  path: "/sio",
  transports: ["websocket"],
});
io.adapter(redisAdapter(REDIS_CONFIG));
const entryInstance = new EntrySubscription();

io.use(SocketAuth);

io.on(SERVER_EVENTS.CONNECTION, async (socket) => {
  console.log("socket.io connection", socket.user);
  // register everybody to a room of their account ID
  if (socket.user.type === "rider") {
    // subcribe individual riders to their IDs
    socket.join(String(socket.user.id));

    socket.to(String(socket.user.id)).emit(SERVER_EVENTS.ASSIGN_ENTRY, await entryInstance.getAssignEntry(socket));
  } else if (socket.user.type === "company") {
    // subcribe companies to their state of the country they are in.
    socket.join(String(socket.user.state));

    socket.emit(SERVER_EVENTS.LISTEN_POOL, await entryInstance.getPool(socket));

  } else if (socket.user.type === "admin") {

    socket.join("admin");
    socket.emit(
      SERVER_EVENTS.LISTEN_POOL_ADMIN,
      await entryInstance.getPoolAdmin(socket)
    );
    socket.on(CLIENT_EVENTS.LISTEN_POOL_ADMIN_HISTORY, async (data) => {
      console.log("data", data);
      await entryInstance.getPoolAdminHistory(socket, data);
    });
  } else if (socket.user.group === "enterprise") {
    // subcribe individual users to their IDs
    socket.join(String(socket.user.enterprise));

    // socket.to(String(socket.user.id)).emit(SERVER_EVENTS.ASSIGN_ENTRY, await entryInstance.getAssignEntry(socket));
  }
});

module.exports = {
  io,
  http,
  app,
};
