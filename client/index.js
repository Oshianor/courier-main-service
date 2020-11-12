const io = require("socket.io-client");
const port = process.env.PORT || 4000;

// const ioClient = io.connect("https://dev.api.logistics.churchesapp.com");

const ioClient = io.connect(`http://localhost:${port}`, {
  query: {
    token: "ndie",
  },
});

ioClient.on("connect", () => console.info("connected"));

ioClient.on("NEW_ENTRY", (entry) => console.info(entry));
