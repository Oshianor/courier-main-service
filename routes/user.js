const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth, isExaltService } = require("../middlewares/auth");


// [moved to accounts service]
// router.patch("/fcmtoken", UserAuth, controller.user.FCMToken);

router.get("/order/pending", UserAuth, controller.user.pending);

router.get("/order/completed", UserAuth, controller.user.completed);

// get my transactions
router.get("/transaction-history", UserAuth, controller.transaction.allByUser);

// used by the accounts service to update account info - name and phone
router.patch("/:userId/account", isExaltService, controller.user.updateUserAccount);

module.exports = router;