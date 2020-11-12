const app = require("./routes");

var http = require("http").createServer(app);
var io = require("socket.io")(http);
const { eventEmitter } = require("../utils");
const { isValidSocketAuth } = require("../middlewares/auth");

// auth middleware
io.use((socket, next) => {
  let { token, type } = socket.handshake.query;
  const user = isValidSocketAuth(token);

  if (user) {
    socket.user = user;
    return next();
  }
  // console.log("Authentication Error");
  return next(new Error("authentication error"));
});

io.on("connection", (socket) => {
  // console.log(socket.user);
  console.log("socket.io connection");
});

const addedToPool = function (entry) {
  console.log(entry);
  console.log(order);
  io.emit("NEW_ENTRY", entry);
  //   io.emit("me", { me: "ndiecodes" });
};

//Assign the event handler to an event:
eventEmitter.on("NEW_ENTRY", addedToPool);

module.exports = {
  io,
  http,
};
