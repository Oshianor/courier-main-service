const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth");
// Create a new user
router.post("/user", auth.login.loginAsUser);
// verify company account
router.post("/verify", auth.verify.account);

module.exports = router;
