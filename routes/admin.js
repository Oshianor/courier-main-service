/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();

// Import Controllers
const admin = require("../controllers/admin");
const company = require("../controllers/company");
const rider = require("../controllers/rider");
const auth = require("../controllers/auth");
const setting = require("../controllers/setting");
const { ACCOUNT_TYPES } = require("../constant/types");

const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// Auth Routes
router.post("/", Auth, admin.create.createAdmin);
router.post("/login", auth.login.admin);

//Admin Routes
router.get("/all", Auth, hasRole([ROLES.ADMIN]), admin.get.all);
router.get("/current", Auth, admin.get.current);

router.get('/transactions', Auth, hasRole([ROLES.ADMIN]), transaction.get.allByAdmin)
router.get('/transactions/:id', Auth, hasRole([ROLES.ADMIN]), transaction.get.single)


// Company routes
router.get("/companies", Auth, company.get.all);

router.get("/companies/:companyId", Auth, company.get.single);

router.put("/companies/:companyId", Auth, company.update.updateSingle);

router.patch("/companies/:companyId/status", Auth, company.update.updateStatus);

router.delete("/companies/:companyId", Auth, hasRole(), company.delete.destroy);

router.patch("/verify/company/:companyId", Auth, hasRole(ROLES.ADMIN), company.update.verification);

router.get("/unverified/companies", Auth, hasRole(ROLES.ADMIN), company.get.allUnveried);

// rider routes
router.get("/rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), rider.get.allByAdmin);
// get all riders for a company
router.get("/:company/rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), admin.get.allRider);
// get a single rider
router.get("/rider/:rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), admin.get.singleRider);
// suspend a rider account
router.patch("/rider/:rider/status", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), rider.update.status);


// settings
// get settings
router.get("/setting", Auth, hasRole([ROLES.ADMIN]), setting.get.admin);
// patch settings
router.patch("/setting", Auth, hasRole([ROLES.ADMIN]), setting.update.admin);

//user routes

router.get("/user/all", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), admin.get.allUsers);
router.get("/user/:userId", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), admin.get.singleUser);

// Admin Updates
router.put("/update", Auth, admin.update.current);
router.patch("/password", Auth, admin.update.password);
router.patch("/:adminId/disable", Auth, hasRole(), admin.update.disable);
router.patch("/:adminId/enable", Auth, hasRole(), admin.update.enable);
router.delete("/:adminId", Auth, hasRole(), admin.delete.destroy);



module.exports = router;
