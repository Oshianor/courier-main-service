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

router.patch("/companies/:companyId/status", adminAuth, controllers.company.updateStatus);

router.delete("/companies/:companyId", adminAuth, controllers.company.destroy);


// Rider routes
router.post("/companies/:companyId/riders", adminAuth, controllers.rider.create);

router.get("/companies/:companyId/riders", adminAuth, controllers.rider.getAll);

router.get("/companies/:companyId/riders/:riderId", adminAuth, controllers.rider.getOne);

router.put("/companies/:companyId/riders/:riderId", adminAuth, controllers.rider.update);

router.delete("/companies/:companyId/riders/:riderId", adminAuth, controllers.rider.destroy);



module.exports = router;
