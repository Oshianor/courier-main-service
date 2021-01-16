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

// get enterprise
router.get("/", [UserAuth, EnterpriseAuth([E_ROLES.MAINTAINER, E_ROLES.OWNER, E_ROLES.BRANCH])], controller.enterprise.getEnterprise);

// edit enterprise account
router.patch("/", [UserAuth, EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH])], controller.enterprise.updateEnterprise);

// get enterprise branches
router.get("/branches", [UserAuth, EnterpriseAuth(E_ROLES.OWNER)], controller.enterprise.allBranches);

// get enterprise maintainers
router.get("/maintainers", [UserAuth, EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH])], controller.enterprise.allMaintainers);

// get enterprise shippings (entries)
router.get("/shipping", [UserAuth, EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH])], controller.enterprise.allEntries);

// get enterprise transactions
router.get("/transactions", [UserAuth, EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH])], controller.enterprise.allTransactions);

// get enterprise pending orders
router.get(
  "/orders/pending",
  [
    UserAuth,
    EnterpriseAuth([E_ROLES.MAINTAINER, E_ROLES.OWNER, E_ROLES.BRANCH]),
  ],
  controller.enterprise.getPendingOrders
);

// get enterprise statistics
router.get(
  "/statistics",
  [
    UserAuth,
    EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH, E_ROLES.MAINTAINER]),
  ],
  controller.enterprise.getStatistics
);

// Add card by enterprise owner and branch
router.post(
  "/card/add",
  UserAuth,
  EnterpriseAuth([E_ROLES.OWNER, E_ROLES.BRANCH]),
  controller.enterprise.addCard
);

// get all cards for an eneterprise
router.get(
  "/card",
  UserAuth,
  EnterpriseAuth([E_ROLES.MAINTAINER, E_ROLES.BRANCH]),
  controller.enterprise.getCards
);

// get line of credit
router.get(
  "/credit",
  UserAuth,
  EnterpriseAuth([E_ROLES.BRANCH, E_ROLES.OWNER]),
  controller.credit.get
);


module.exports = router;