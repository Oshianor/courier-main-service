const express = require("express");
const router = express.Router();
const { LoginAsUser } = require("../controllers/auth");
const auth = require("../controllers/auth");
// Create a new user
router.post("/user", auth.login.LoginAsUser);

module.exports = router;