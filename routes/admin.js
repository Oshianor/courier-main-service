const express = require("express");
const router = express.Router();
const { createAdmin, adminLogin, getAdmins } = require("../controllers/admin");

const { hasRole, ROLES } = require("../middlewares/role");
const { adminAuth } = require("../middlewares/adminAuth");

// Create a new admin
router.post("/", createAdmin);

router.post("/login", adminLogin);

router.get("/", adminAuth, hasRole(["admin"]), getAdmins);

module.exports = router;
