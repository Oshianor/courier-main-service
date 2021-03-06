const config = require("config");
const port = process.env.PORT || config.get("application.port");
const express = require("express");
const app = express();
const cors = require("cors");
const fileUpload = require("express-fileupload");
const error = require("../middlewares/error");
const endpointNotFound = require("../middlewares/404");
const entry = require("../routes/entry");
const order = require("../routes/order");
const auth = require("../routes/auth");
const admin = require("../routes/admin");
const pricing = require("../routes/pricing");
const vehicle = require("../routes/vehicle");
const distancePrice = require("../routes/distancePrice");
const company = require("../routes/company");
const rider = require("../routes/rider");
const user = require("../routes/user");
const rating = require("../routes/rating");
const bank = require("../routes/bank");
const subscription = require("../routes/subscription");
const card = require("../routes/card");
const wallet = require("../routes/wallet");
const credit = require("../routes/credit");
const enterprise = require("../routes/enterprise");
const interstatePrice = require("../routes/interstatePrice");
const corsOptions = {
  origin: "*",
  exposedHeaders: ["x-auth-token"],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "100mb", extended: true }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(express.static("public"));
app.use(fileUpload({}))

app.use("/api/v1/admin", admin);
app.use("/api/v1/admin/pricing", pricing);
app.use("/api/v1/admin/vehicle", vehicle);
app.use("/api/v1/admin/distance-price", distancePrice);
app.use("/api/v1/company", company);
app.use("/api/v1/interstate-price", interstatePrice);
app.use("/api/v1/entry", entry);
app.use("/api/v1/auth", auth);
app.use("/api/v1/rider", rider);
app.use("/api/v1/user", user);
app.use("/api/v1/order", order);
app.use("/api/v1/rating", rating);
app.use("/api/v1/bank", bank);
app.use("/api/v1/subscription", subscription);
app.use("/api/v1/card", card);
app.use("/api/v1/wallet", wallet);
app.use("/api/v1/credit", credit);
app.use("/api/v1/enterprise", enterprise);
app.use(error);
app.use(endpointNotFound);

module.exports = app;
