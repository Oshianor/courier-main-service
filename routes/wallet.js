/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth, EnterpriseAuth } = require("../middlewares/auth");

// create vehicle
router.post("/fund", UserAuth, EnterpriseAuth(["owner", "branch"]), controller.vehicle.vehicle);


module.exports = router;
