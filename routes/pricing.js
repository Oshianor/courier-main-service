/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// create pricing
router.post("/", Auth, hasRole([ROLES.SUPER_ADMIN]), controller.pricing.create);
// get all pricing plan
router.get("/", Auth, hasRole([ROLES.SUPER_ADMIN]), controller.pricing.all);
// update a single pricing document
router.put(
  "/:pricingId",
  Auth,
  hasRole([ROLES.SUPER_ADMIN]),
  controller.pricing.update
);




module.exports = router;
