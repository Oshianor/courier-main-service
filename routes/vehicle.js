/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const vehicle = require("../controllers/vehicle");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// create vehicle
router.post("/", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), vehicle.create.vehicle);
// get all vehicle 
router.get("/", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), vehicle.get.all);
// update a single vehicle document
router.put("/:vehicleId", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), vehicle.update.vehicle);




module.exports = router;
