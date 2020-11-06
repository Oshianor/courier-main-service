const app = require("./routes");

var http = require("http").createServer(app);
var io = require("socket.io")(http);
const { eventEmitter } = require("../utils");

io.on("connection", (s) => {
  console.error("socket.io connection");
});

const addedToPool = function (entry, order) {
  console.log(entry);
  console.log(order);
  io.emit("newEntry", entry);
  io.emit("newOrder", order);
  //   io.emit("me", { me: "ndiecodes" });
};

//Assign the event handler to an event:
eventEmitter.on("newEntry", addedToPool);

module.exports = {
  io,
  http,
};
