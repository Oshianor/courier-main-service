const app = require("./routes");

var http = require("http").createServer(app);
var io = require("socket.io")(http);
const { eventEmitter } = require("../utils");

io.on("connection", (s) => {
  console.error("socket.io connection");
});

var addedToPool = function () {
  io.emit("me", { me: "ndiecodes" });
};

//Assign the event handler to an event:
eventEmitter.on("addedToPool", addedToPool);

module.exports = {
  io,
  http,
};
