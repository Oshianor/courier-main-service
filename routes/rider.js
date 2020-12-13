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

router.patch("/fcmtoken", Auth, controller.rider.FCMToken);
//get all orders by a rider for the day
router.get("/basket", Auth, controller.rider.basket);
//get all orders by a rider for the day
router.get("/basket/completed", Auth, controller.rider.completedOrder);

//get all trips completed by a rider in the current month
router.get("/trips", Auth, controller.rider.trips);

router.get("/transaction", Auth, controller.rider.getTransaction);



module.exports = router;
