/**
 * This File contains all Admin Related Routes
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const {
  UserAuth,
  EnterpriseAuth,
  E_ROLES,
  isExaltService,
} = require("../middlewares/auth");

// create wallet account for enterprise
router.post("/", isExaltService, controller.wallet.createWallet);

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

// get wallet history
router.get(
  "/history",
  UserAuth,
  EnterpriseAuth([E_ROLES.BRANCH, E_ROLES.MAINTAINER ]),
  controller.wallet.walletHistory
);


module.exports = router;
