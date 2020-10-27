const express = require("express");
const router = express.Router();

const company = require("../controllers/company");
const auth = require("../controllers/auth");
const { Auth } = require("../middlewares/auth");
const rider = require("../controllers/rider");

// Rider routes
router.post("/", rider.create.createSelf);

router.post("/login", auth.login.riderLogin);
module.exports = router;
