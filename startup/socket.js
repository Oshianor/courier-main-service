const app = require("./routes");

var http = require("http").createServer(app);
var io = require("socket.io")(http);
const { eventEmitter } = require("../utils");

function isValid(token) {
  if (token === "ndie") {
    return true;
  }
  return false;
}
// middleware
io.use((socket, next) => {
  let token = socket.handshake.query.token;
  if (isValid(token)) {
    return next();
  }
  console.log("Authentication Error");
  return next(new Error("authentication error"));
});

io.on("connection", (s) => {
  console.log(s);
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
