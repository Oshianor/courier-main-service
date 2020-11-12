const io = require("socket.io-client");
const port = process.env.PORT || 4000;

// const ioClient = io.connect("https://dev.api.logistics.churchesapp.com");

const ioClient = io.connect(`http://localhost:${port}`, {
  query: {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmYTFkMzE2YWJiY2M0NGZiZTY5NmI4NCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInR5cGUiOiJjb21wYW55IiwiaWF0IjoxNjA1MjAzMzc0LCJleHAiOjE2MDU4MDgxNzR9.oBZ56-wwN5TnUsykhuth4B8By-huK8Cu66Y5GzSN40w",
  },
});

ioClient.on("connect", () => console.info("connected"));

ioClient.on("NEW_ENTRY", (entry) => console.info(entry));
