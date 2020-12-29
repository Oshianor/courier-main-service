const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { CompanyAuth } = require("../middlewares/auth");

// create subscription
router.post("/", [CompanyAuth], controller.subscription.createSubscription);
// get subscription
router.get("/", [CompanyAuth], controller.subscription.getSubscription);
// change subscription
router.patch("/update", [CompanyAuth], controller.subscription.updateSubscription);

module.exports = router;