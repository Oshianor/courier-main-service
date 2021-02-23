const express = require("express");
const router = express.Router();
const controllers = require("../controllers");
const { Auth, UserAuth, EnterpriseAuth, E_ROLES, } = require("../middlewares/auth");


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

// ENTERPRISE ROUTES
router.patch("/set-password", controllers.auth.setPassword);

// [moved > accounts-service]
// router.post("/enterprise-login", controllers.auth.enterpriseLogin);

//

// [moved > accounts-service]
// router.patch(
//   "/update-status",
//   [UserAuth, EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH])],
//   controllers.auth.updateEnterpriseAccountStatus
// );

// Forgot password flow
router.post("/password/forgot", controllers.auth.forgotPassword2);
router.post("/password/reset", controllers.auth.resetPassword2);

module.exports = router;
