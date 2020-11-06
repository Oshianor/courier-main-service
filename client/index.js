const io = require("socket.io-client"),
  ioClient = io.connect("http://localhost:4000");

ioClient.on("newEntry", (msg) => console.info(msg));

ioClient.on("newOrder", (msg) => console.info(msg));
