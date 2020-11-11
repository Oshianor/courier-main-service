const express = require("express");
const router = express.Router();

const company = require("../controllers/company");
const auth = require("../controllers/auth");
const { Auth } = require("../middlewares/auth");
const rider = require("../controllers/rider");

// Rider routes
// get my data
router.get("/me", Auth, rider.get.me);
// create an account from the app.
router.post("/", rider.create.createSelf);
// update rider location
router.patch("/location", Auth, rider.update.location);

module.exports = router;
