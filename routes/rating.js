const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth, Auth } = require("../middlewares/auth");

// Rating routes

// rate a rider by a user 
router.post("/user", UserAuth, controller.rating.rateUser);

// rate a user by a rider 
router.post("/rider", Auth, controller.rating.rateUser);

// get all rider rating
router.get("/rider-ratings", Auth, controller.rating.getAllRiderRatings);

module.exports = router;