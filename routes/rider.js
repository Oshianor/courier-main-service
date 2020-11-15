const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { Auth } = require("../middlewares/auth");

// Rider routes
// get my data
router.get("/me", Auth, controller.rider.me);
// create an account from the app.
router.post("/", controller.rider.createSelf);
// update rider location
router.patch("/location", Auth, controller.rider.location);
// go online/offline
router.patch("/online", Auth, controller.rider.online);

module.exports = router;
