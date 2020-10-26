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

const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// Auth Routes
router.post("/", admin.create.createAdmin);
router.post("/login", auth.login.adminLogin);

//Admin Routes
router.get("/", Auth, hasRole(["admin"]), admin.get.single);

// Company routes
router.post("/companies", Auth, company.create.company);

router.get("/companies", Auth, company.get.all);

router.get("/companies/:companyId", Auth, company.get.single);

router.put("/companies/:companyId", Auth, company.update.updateSingle);

router.patch("/companies/:companyId/status", Auth, company.update.updateStatus);

router.delete("/companies/:companyId", Auth, hasRole(),company.delete.destroy);


// Rider routes
router.post("/companies/:companyId/riders", Auth, rider.create.create);

router.get("/companies/:companyId/riders", Auth, rider.get.all);

router.get("/companies/:companyId/riders/:riderId", Auth, rider.get.single);

router.put("/companies/:companyId/riders/:riderId", Auth, rider.update.updateSingle);

router.delete("/companies/:companyId/riders/:riderId", Auth, rider.delete.destroy);



module.exports = router;
