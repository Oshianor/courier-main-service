const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const {
  EnterpriseAuth,
  E_ROLES,
  UserAuth
} = require("../middlewares/auth");


// [moved to accounts service]
// get enterprise
// router.get("/", [UserAuth, EnterpriseAuth([E_ROLES.MAINTAINER, E_ROLES.BRANCH])], controller.enterprise.getEnterprise);

// edit enterprise account
router.patch("/", [UserAuth, EnterpriseAuth([E_ROLES.BRANCH])], controller.enterprise.updateEnterprise);

// [moved to accounts service]
// get enterprise branches
// router.get("/branches", [UserAuth, EnterpriseAuth(E_ROLES.OWNER)], controller.enterprise.allBranches);

// [moved to accounts service]
// get enterprise maintainers
// router.get("/maintainers", [UserAuth, EnterpriseAuth([E_ROLES.BRANCH])], controller.enterprise.allMaintainers);

// get enterprise shippings (entries)
router.get("/shipping", [UserAuth, EnterpriseAuth([E_ROLES.MAINTAINER, E_ROLES.BRANCH])], controller.enterprise.allEntries);

// get enterprise transactions
router.get("/transactions", [UserAuth, EnterpriseAuth([E_ROLES.MAINTAINER, E_ROLES.BRANCH])], controller.enterprise.allTransactions);

// get enterprise pending orders
router.get(
  "/orders/pending",
  [
    UserAuth,
    EnterpriseAuth([E_ROLES.MAINTAINER, E_ROLES.BRANCH]),
  ],
  controller.enterprise.getPendingOrders
);

// get enterprise statistics
router.get(
  "/statistics",
  [
    UserAuth,
    EnterpriseAuth([E_ROLES.BRANCH, E_ROLES.MAINTAINER]),
  ],
  controller.enterprise.getStatistics
);

// get line of credit
router.get(
  "/credit",
  UserAuth,
  EnterpriseAuth([E_ROLES.BRANCH, E_ROLES.OWNER]),
  controller.credit.get
);
// request for credit
router.post(
  "/credit/request",
  UserAuth,
  EnterpriseAuth([E_ROLES.BRANCH, E_ROLES.OWNER]),
  controller.credit.requestCredit
);


module.exports = router;