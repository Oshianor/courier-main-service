const express = require("express");
const router = express.Router();
const controllers = require("../controllers");
const { Auth } = require("../middlewares/auth");

// login as a user
router.post("/user", controllers.auth.userLogin);
// login as a company
router.post("/company", controllers.auth.companyLogin);
// login as a rider
router.post("/rider", controllers.auth.riderLogin);
// verify all accounts (admin, company, rider)
router.post("/verify", controllers.auth.accountVerify);
// verify company account
router.get("/verify/company", controllers.auth.companyVerify);
// change password
router.post("/update-password", [Auth], controllers.auth.updatePassword);

// FORGOT PASSWORD
router.post("/validate-email", controllers.auth.validateEmail);

router.post("/validate-otp", controllers.auth.validateOTP);

router.post("/reset-password", controllers.auth.resetPassword);

// SET PASSWORD
router.patch("/set-password", controllers.auth.setPassword);

module.exports = router;
