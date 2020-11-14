require("winston-mongodb");
require("./startup/aws");
require("./startup/logger");
const config = require("config");
const port = process.env.PORT || config.get("application.port");
const mongoose = require('mongoose');
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const cors = require("cors");
const redisAdapter = require("socket.io-redis");
const fileUpload = require("express-fileupload");
const { SocketAuth } = require("./middlewares/auth");
const error = require("./middlewares/error");
const entry = require("./routes/entry");
const auth = require("./routes/auth");
const admin = require("./routes/admin");
const pricing = require("./routes/pricing");
const vehicle = require("./routes/vehicle");
const distancePrice = require("./routes/distancePrice");
const company = require("./routes/company");
const rider = require("./routes/rider");
const { SERVER_EVENTS } = require("./constant/events");
const handler = require("./socket")
const io = require("socket.io")(http, {
  path: "/sio",
  transports: ["websocket"],
});
io.adapter(redisAdapter({ host: "127.0.0.1", port: 6379 }));
app.use(cors({
  origin: "*",
  exposedHeaders: ["x-auth-token"],
}));
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("public"));
app.use(fileUpload());
app.use("/api/v1/admin", admin);
app.use("/api/v1/admin/pricing", pricing);
app.use("/api/v1/admin/vehicle", vehicle);
app.use("/api/v1/admin/distance-price", distancePrice);
app.use("/api/v1/company", company);
app.use("/api/v1/entry", entry);
app.use("/api/v1/auth", auth);
app.use("/api/v1/rider", rider);
app.use(error);

io.use(SocketAuth);
io.on(SERVER_EVENTS.CONNECTION, async (socket) => {
  console.log("socket.user", socket.user);
  console.log("socket.io connection");
  // handler.entry.pool(socket);
  socket.emit(SERVER_EVENTS.LISTEN_POOL,  await handler.entry.pool(socket));
});
app.set("sio", io);
mongoose
  .connect(config.get("database.url"), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB...");
    http.listen(port, () => console.error(`listening on http://localhost:${port}`));

  })
  .catch((err) => console.error("Could not connect to MongoDB..."));
