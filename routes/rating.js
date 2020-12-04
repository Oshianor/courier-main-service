const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { Auth } = require("../middlewares/auth");

// Rating routes

// rate a user 
router.post("/rate-user", Auth, controller.rating.rateUser);

// get all rider rating
router.get("/rider-ratings", Auth, controller.rating.getAllRiderRatings);


module.exports = router;  
