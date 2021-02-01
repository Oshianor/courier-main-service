const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth, Auth } = require("../middlewares/auth");


router.post("/enroute-delivery", Auth, controller.order.riderInitiateOrderDelivery);

router.post("/arrived-delivery", Auth, controller.order.riderArriveAtDelivery);

router.post("/confirm-delivery", Auth, controller.order.confirmDelivery);

// router.get("/weekly-overview", Auth, controller.order.orderOverview);

router.post("/order-details", controller.order.orderDetails);

router.get("/order-history/:orderId", controller.order.orderHistory);


module.exports = router;