const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// Auth Routes
router.post("/", Auth, controller.admin.createAdmin);
router.post("/login", controller.auth.adminLogin);

//Admin Routes
router.get("/all", Auth, hasRole([ROLES.ADMIN]), controller.admin.all);
router.get("/current", Auth, controller.admin.me);

router.get('/transactions', Auth, hasRole([ROLES.ADMIN]), controller.transaction.allByAdmin)
router.get('/transactions/:id', Auth, hasRole([ROLES.ADMIN]), controller.transaction.single)


// Company routes
router.get("/companies", Auth, controller.company.all);

router.get("/companies/:companyId", Auth, controller.company.single);

router.put("/companies/:companyId", Auth, controller.company.updateSingle);

router.patch("/companies/:companyId/status", Auth, controller.company.updateStatus);

router.delete("/companies/:companyId", Auth, hasRole(), controller.company.destroy);

router.patch("/verify/company/:companyId", Auth, hasRole(ROLES.ADMIN), controller.company.verification);

router.get("/unverified/companies", Auth, hasRole(ROLES.ADMIN), controller.company.allUnveried);

// rider routes
router.get("/rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.rider.allByAdmin);
// get all riders for a company
router.get("/:company/rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.admin.allRider);
// get a single rider
router.get("/rider/:rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.admin.singleRider);
// suspend a rider account
router.patch("/rider/:rider/status", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.rider.status);



// settings
// get settings
router.get("/setting", Auth, hasRole([ROLES.ADMIN]), controller.setting.getAdmin);
// patch settings
router.patch("/setting", Auth, hasRole([ROLES.ADMIN]), controller.setting.updateAdmin);

//user routes

router.get("/user/all", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.admin.allUsers);
router.get("/user/:userId", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.admin.singleUser);

// Admin Updates
router.put("/update", Auth, controller.admin.updateMe);
router.patch("/password", Auth, controller.admin.password);
router.patch("/:adminId/disable", Auth, hasRole(), controller.admin.disable);
router.patch("/:adminId/enable", Auth, hasRole(), controller.admin.enable);
router.delete("/:adminId", Auth, hasRole(), controller.admin.destroy);



module.exports = router;
