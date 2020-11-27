const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth, Auth } = require("../middlewares/auth");


router.post("/enroute-delivery", Auth, controller.order.riderInitiateOrderDelivery);

router.post("/arrived-delivery", Auth, controller.order.riderArriveAtDelivery);

router.post("/confirm-delivery", Auth, controller.order.confirmDelivery);


module.exports = router;