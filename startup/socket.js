const app = require("./routes");

var http = require("http").createServer(app);
var io = require("socket.io")(http);

io.on("connection", (s) => {
  console.error("socket.io connection");
});


module.exports = {
  io,
  http,
};
