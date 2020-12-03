const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { Auth } = require("../middlewares/auth");

// Rating routes

// rate a user
router.post("/rate-user", Auth, controller.rating.rateUser);

// get my rating
router.post("/get-ratings", Auth, controller.rating.getAllRatings);

// get my rating
router.post("/get-rating", Auth, controller.rating.getOneRating);


module.exports = router;  
