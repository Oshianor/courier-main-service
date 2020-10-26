/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();

// Import Controllers
const admin = require("../controllers/admin");
const company = require('../controllers/company')
const rider = require("../controllers/rider");
const auth = require("../controllers/auth");

const { hasRole, ROLES } = require("../middlewares/role");
const { adminAuth } = require("../middlewares/adminAuth");

// Auth Routes
router.post("/", admin.create.createAdmin);
router.post("/login", auth.login.adminLogin);

//Admin Routes
router.get("/", adminAuth, hasRole(["admin"]), admin.get.single);

// Company routes
router.post("/companies", adminAuth, company.create.createCompany);

router.get("/companies", adminAuth, company.get.all);

router.get("/companies/:companyId", adminAuth, company.get.single);

router.put("/companies/:companyId", adminAuth, company.update.updateSingle);

router.patch("/companies/:companyId/status", adminAuth, company.update.updateStatus);

router.delete("/companies/:companyId", adminAuth, company.delete.destroy);


// Rider routes
router.post("/companies/:companyId/riders", adminAuth, rider.create.create);

router.get("/companies/:companyId/riders", adminAuth, rider.get.all);

router.get("/companies/:companyId/riders/:riderId", adminAuth, rider.get.single);

router.put("/companies/:companyId/riders/:riderId", adminAuth, rider.update.updateSingle);

router.delete("/companies/:companyId/riders/:riderId", adminAuth, rider.delete.destroy);



module.exports = router;
