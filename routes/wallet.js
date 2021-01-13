/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth, EnterpriseAuth, E_ROLES } = require("../middlewares/auth");

// fund wallet
router.post(
  "/fund",
  UserAuth,
  EnterpriseAuth([E_ROLES.BRANCH, E_ROLES.OWNER]),
  controller.wallet.fundWallet
);

// get wallet
router.get(
  "/",
  UserAuth,
  EnterpriseAuth([E_ROLES.BRANCH, E_ROLES.OWNER]),
  controller.wallet.get
);


module.exports = router;
