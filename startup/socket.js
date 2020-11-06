const app = require("./routes");

var http = require("http").createServer(app);
var io = require("socket.io")(http);
const { eventEmitter } = require("../utils");

io.on("connection", (s) => {
  console.error("socket.io connection");
});

var myEventHandler = function () {
  console.log("I hear a scream!");
};

//Assign the event handler to an event:
eventEmitter.on("scream", myEventHandler);

module.exports = {
  io,
  http,
};
