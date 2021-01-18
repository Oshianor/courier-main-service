const config = require("config");
const app = require("./routes");
const http = require("http").createServer(app);
const EntrySubscription = require("../subscription/entry");
const redisAdapter = require("socket.io-redis");
const { Container } = require("typedi");
const { SocketAuth } = require("../middlewares/auth");
const { SERVER_EVENTS, CLIENT_EVENTS } = require("../constant/events");
const io = require("socket.io")(http, {
  path: "/sio",
  transports: ["websocket"],
});
io.adapter(redisAdapter(config.get("application.redis")));
const entryInstance = Container.get(EntrySubscription);

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
  }
});

module.exports = {
  io,
  http,
  app,
};
