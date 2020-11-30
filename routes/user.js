const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth } = require("../middlewares/auth");

// get my data
router.patch("/fcmtoken", UserAuth, controller.user.FCMToken);

router.post("/order/pending", UserAuth, controller.user.pending);

router.post("/order/completed", UserAuth, controller.user.completed);


module.exports = router;
