const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth } = require("../middlewares/auth");

// get my data
router.patch("/fcmtoken", UserAuth, controller.user.FCMToken);

router.get("/order/pending", UserAuth, controller.user.pending);

router.get("/order/completed", UserAuth, controller.user.completed);

// get my transactions
router.get("/transaction-history", UserAuth, controller.transaction.allByUser);


module.exports = router;
