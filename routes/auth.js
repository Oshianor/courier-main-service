const express = require("express");
const router = express.Router();
const { LoginAsUser } = require("../controllers/auth");

// Create a new user
router.post("/user", LoginAsUser);

module.exports = router;