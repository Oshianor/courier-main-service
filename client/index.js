const io = require("socket.io-client");
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmYTFkMzE2YWJiY2M0NGZiZTY5NmI4NCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInR5cGUiOiJjb21wYW55IiwiaWF0IjoxNjA1MzkyMDk5LCJleHAiOjE2MDU5OTY4OTl9.pbgW6vTfe_KU5yJlnhS8ecleAm6SgYt5t0tSaRCtpK4";
const type = "company";

const socket = io.connect(`http://localhost:6001?token=${token}&type=${type}`, {
  path: "/sio",
  transports: ["websocket"],
});

// console.log("socket", socket);

socket.on("connect", function () { 
  console.info("connected")

    
});

// socket.on("listenPool", function (message) {
//   console.log("datadata", message);
// });


socket.on("newEntry", function (message) {
  console.log("new entry", message);
});
