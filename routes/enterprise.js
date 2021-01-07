const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const {
  hasRole,
  ROLES,
  Auth,
  EnterpriseAuth,
  E_ROLES,
  UserAuth
} = require("../middlewares/auth");

// create organisation
router.post("/create-organization", [Auth, hasRole([ROLES.ADMIN])], controller.enterprise.createOrganization);

// create branch
router.post("/create-branch", [UserAuth, EnterpriseAuth([E_ROLES.OWNER])], controller.enterprise.createBranch);

// create maintainer
router.post("/create-maintainer", [UserAuth, EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH])], controller.enterprise.createMaintainer);

// edit enterprise account
router.patch("/", [UserAuth, EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH])], controller.enterprise.updateEnterprise);

// Add card by enterprise owner and branch
router.post(
  "/card/add",
  UserAuth,
  EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH]),
  controller.enterprise.addCard
);


module.exports = router;