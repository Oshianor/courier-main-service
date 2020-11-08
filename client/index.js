const io = require("socket.io-client");
const port = process.env.PORT || 4000;

// const ioClient = io.connect("https://dev.api.logistics.churchesapp.com");

const ioClient = io.connect(`http://localhost:${port}`);

ioClient.on("connect", () => console.info("connected"));

ioClient.on("newEntry", (msg) => console.info(msg));

ioClient.on("newOrder", (msg) => console.info(msg));
