const config = require("config")
const app = require("./routes");
const http = require("http").createServer(app);
const EntryService = require("../services/entry");
const redisAdapter = require("socket.io-redis");
const { SocketAuth } = require("../middlewares/auth");
const { SERVER_EVENTS } = require("../constant/events");
const io = require("socket.io")(http, {
  path: "/sio",
  transports: ["websocket"],
});
io.adapter(redisAdapter(config.get("application.redis")));
const { Container } = require("typedi");
const entryInstance = Container.get(EntryService);

io.use(SocketAuth);
io.on(SERVER_EVENTS.CONNECTION, async (socket) => {
  console.log("socket.io connection");
  // register everybody to a room of their account ID
  if (socket.user.type === "rider") {
    socket.join(socket.user.id);
  } else if (socket.user.type === "company") {
    socket.emit(SERVER_EVENTS.LISTEN_POOL, await entryInstance.getPool(socket));
  } else if (socket.user.type === "admin") {
    socket.join("admin");
    socket.emit(SERVER_EVENTS.LISTEN_POOL_ADMIN, await entryInstance.getPoolAdmin(socket));
  }
});

module.exports = {
  io,
  http,
  app,
};