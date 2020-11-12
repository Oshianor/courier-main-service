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
const io = require("socket.io")(http, {
  path: "/sio",
  transports: ["websocket"],
});
const fileUpload = require("express-fileupload");
const error = require("./middlewares/error");
const entry = require("./routes/entry");
const auth = require("./routes/auth");
const admin = require("./routes/admin");
const pricing = require("./routes/pricing");
const vehicle = require("./routes/vehicle");
const distancePrice = require("./routes/distancePrice");
const company = require("./routes/company");
const rider = require("./routes/rider");
const corsOptions = {
  origin: "*",
  exposedHeaders: ["x-auth-token"],
};
app.use(cors(corsOptions));
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


// const { http } = require("./startup/socket");

io.on("connection", (socket) => {
  // console.log(socket.user);
  console.log("socket.io connection");
});

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

