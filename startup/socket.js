const app = require("./routes");

var http = require("http").createServer(app);
var io = require("socket.io")(http);
const { eventEmitter } = require("../utils");

io.on("connection", (s) => {
  console.error("socket.io connection");
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
