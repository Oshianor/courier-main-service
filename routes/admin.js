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
const { ACCOUNT_TYPES } = require("../constant/types");

const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// Auth Routes
router.post("/", Auth, admin.create.createAdmin);
router.post("/login", auth.login.admin);

//Admin Routes
router.get("/all", Auth, hasRole([ROLES.ADMIN]), admin.get.single);
router.get("/current", Auth, admin.get.current);

// Company routes
// create a company by an admin
router.post("/companies", 
// Auth, hasRole([ROLES.ADMIN]), 
company.create.company);

router.get("/companies", Auth, company.get.all);

router.get("/companies/:companyId", Auth, company.get.single);

router.put("/companies/:companyId", Auth, company.update.updateSingle);

router.patch("/companies/:companyId/status", Auth, company.update.updateStatus);

router.delete("/companies/:companyId", Auth, hasRole(), company.delete.destroy);


// rider routes
router.get("/rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), rider.get.allByAdmin);


module.exports = router;
