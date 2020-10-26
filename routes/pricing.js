/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const pricing = require("../controllers/pricing");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// create pricing
router.post("/", Auth, hasRole([ROLES.SUPER_ADMIN]), pricing.create.pricing);
// get all pricing plan
router.get("/", Auth, hasRole([ROLES.SUPER_ADMIN]), pricing.get.all);
// update a single pricing document
router.put("/:pricingId", Auth, hasRole([ROLES.SUPER_ADMIN]), pricing.update.pricing);




module.exports = router;
