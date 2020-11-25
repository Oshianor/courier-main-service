const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth } = require("../middlewares/auth");

// get my data
router.patch("/fcmtoken", UserAuth, controller.user.FCMToken);

module.exports = router;
