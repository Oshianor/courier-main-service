const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { Auth } = require("../middlewares/auth");

// create subscription
router.post("/", Auth, controller.subscription.createSubscription);
// get subscription
router.get("/", Auth, controller.subscription.getSubscription);
// create subscription
router.patch("/update", Auth, controller.subscription.editSubscription);

module.exports = router;