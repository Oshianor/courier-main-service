const io = require("socket.io-client"),
  ioClient = io.connect("http://localhost:4000");

ioClient.on("seq", (msg) => console.info(msg));

ioClient.on("me", (msg) => console.info(msg));