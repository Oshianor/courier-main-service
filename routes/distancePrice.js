/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const dp = require("../controllers/distancePrice");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// create distance price
router.post("/", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), dp.create.distancePrice);
// get all distance price 
router.get("/", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), dp.get.all);
// update a single distance price document
router.patch("/:dp", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), dp.update.distancePrice);
// delete a distance price
router.delete("/:dp", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), dp.delete.dp);


module.exports = router;
