/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth, EnterpriseAuth, E_ROLES } = require("../middlewares/auth");

// create vehicle
router.post(
  "/fund",
  UserAuth,
  EnterpriseAuth([E_ROLES.BRANCH, E_ROLES.OWNER]),
  controller.wallet.fundWallet
);


module.exports = router;
