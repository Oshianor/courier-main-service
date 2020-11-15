const express = require("express");
const router = express.Router();
const controllers = require("../controllers");

// login as a company
router.post("/company", controllers.auth.companyLogin);
// login as a rider
router.post("/rider", controllers.auth.riderLogin);
// verify all accounts (admin, company, rider)
router.post("/verify", controllers.auth.accountVerify);
// verify company account
router.post("/verify/company", controllers.auth.companyVerify);


module.exports = router;
