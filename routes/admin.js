/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const controllers = require("../controllers/admin");

const { hasRole, ROLES } = require("../middlewares/role");
const { adminAuth } = require("../middlewares/adminAuth");

// Auth Routes
router.post("/", controllers.auth.createAdmin);
router.post("/login", controllers.auth.adminLogin);

//Admin Routes
router.get("/", adminAuth, hasRole(["admin"]), controllers.admin.getAdmins);

// Company routes
router.post("/companies", adminAuth, controllers.company.createCompany);

router.get("/companies", adminAuth, controllers.company.getAll);

router.get("/companies/:companyId", adminAuth, controllers.company.getOne);

router.put("/companies/:companyId", adminAuth, controllers.company.update);

router.delete("/companies/:companyId", adminAuth, controllers.company.destroy);

module.exports = router;
