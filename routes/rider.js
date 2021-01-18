const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { Auth, RiderAuth } = require("../middlewares/auth");

// Rider routes
// get my data
router.get("/me", RiderAuth, controller.rider.me);
// create an account from the app.
router.post("/", controller.rider.createSelf);
// update rider location
router.patch("/location", RiderAuth, controller.rider.location);
// go online/offline
router.post("/online", RiderAuth, controller.rider.online);

router.patch("/fcmtoken", RiderAuth, controller.rider.FCMToken);
//get all orders by a rider for the day
router.get("/basket", RiderAuth, controller.rider.basket);
//get all orders by a rider for the day
router.get("/basket/completed", RiderAuth, controller.rider.completedOrder);

//get all trips completed by a rider in the current month
router.get("/trips", RiderAuth, controller.rider.trips);

router.get("/transaction", RiderAuth, controller.rider.getTransaction);


module.exports = router;
