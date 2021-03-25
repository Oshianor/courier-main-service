/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// create distance price
router.post("/", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.distancePrice.admin);
// get all distance price 
router.get(
  "/",
  Auth,
  hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  controller.distancePrice.getAdmin
);
// update a single distance price document
router.patch(
  "/:dp",
  Auth,
  hasRole([ROLES.ADMIN]),
  controller.distancePrice.updateAdmin
);
// delete a distance price
router.delete(
  "/:dp",
  Auth,
  hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  controller.distancePrice.deleteAdmin
);


module.exports = router;
