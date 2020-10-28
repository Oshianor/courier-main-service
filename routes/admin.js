/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();

// Import Controllers
const admin = require("../controllers/admin");
const company = require("../controllers/company");
const auth = require("../controllers/auth");
const { ACCOUNT_TYPES } = require("../constant/types");

const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// Auth Routes
router.post("/", admin.create.createAdmin);
router.post("/login", auth.login.adminLogin);

//Admin Routes
router.get("/all", Auth(ACCOUNT_TYPES.ADMIN), hasRole(["admin"]), admin.get.single);
router.get("/current", Auth(ACCOUNT_TYPES.ADMIN), admin.get.current);

// Company routes
router.post("/companies", Auth(ACCOUNT_TYPES.ADMIN), company.create.company);

router.get("/companies", Auth(ACCOUNT_TYPES.ADMIN), company.get.all);

router.get("/companies/:companyId",  Auth(ACCOUNT_TYPES.ADMIN), company.get.single);

router.put("/companies/:companyId",  Auth(ACCOUNT_TYPES.ADMIN), company.update.updateSingle);

router.patch("/companies/:companyId/status",  Auth(ACCOUNT_TYPES.ADMIN), company.update.updateStatus);

router.delete("/companies/:companyId",  Auth(ACCOUNT_TYPES.ADMIN), hasRole(), company.delete.destroy);

module.exports = router;
