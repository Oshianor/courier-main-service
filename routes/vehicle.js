/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// create vehicle
router.post("/", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.vehicle.vehicle);
// get all vehicle 
router.get("/", controller.vehicle.all);
// get a single vehicle
router.get("/:vehicleId", controller.vehicle.single);
// update a single vehicle document
router.put(
  "/:vehicleId",
  Auth,
  hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  controller.vehicle.updateVehicle
);


module.exports = router;
