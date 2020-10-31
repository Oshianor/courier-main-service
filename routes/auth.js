const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth");

// login as a company
router.post("/company", auth.login.company);
// login as a rider
router.post("/rider", auth.login.rider);
// verify all accounts (admin, company, rider)
router.post("/verify", auth.verify.account);

module.exports = router;
