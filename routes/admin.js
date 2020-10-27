/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();

// Import Controllers
const admin = require("../controllers/admin");
const company = require("../controllers/company");
const auth = require("../controllers/auth");

const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// Auth Routes
router.post("/", admin.create.createAdmin);
router.post("/login", auth.login.adminLogin);

//Admin Routes
router.get("/all", Auth, hasRole(["admin"]), admin.get.single);
router.get("/current", Auth, admin.get.current);

// Company routes
router.post("/companies", Auth, company.create.company);

router.get("/companies", Auth, company.get.all);

router.get("/companies/:companyId", Auth, company.get.single);

router.put("/companies/:companyId", Auth, company.update.updateSingle);

router.patch("/companies/:companyId/status", Auth, company.update.updateStatus);

router.delete("/companies/:companyId", Auth, hasRole(), company.delete.destroy);

module.exports = router;
