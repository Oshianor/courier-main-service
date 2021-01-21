const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// Auth Routes
router.post("/", Auth, controller.admin.createAdmin);
router.post("/login", controller.auth.adminLogin);

//Admin Routes
router.get("/all", Auth, hasRole([ROLES.ADMIN]), controller.admin.all);
router.get("/current", Auth, controller.admin.me);

router.get('/transactions', Auth, hasRole([ROLES.ADMIN]), controller.transaction.allByAdmin)
router.get('/transactions/:id', Auth, hasRole([ROLES.ADMIN]), controller.transaction.single)


// Company routes
router.get("/companies", Auth, controller.company.all);

router.get("/companies/:companyId", Auth, controller.company.single);

router.put("/companies/:companyId", Auth, controller.company.updateSingle);

router.patch("/companies/:companyId/status", Auth, controller.company.updateStatus);

router.delete("/companies/:companyId", Auth, hasRole(), controller.company.destroy);

router.patch("/verify/company/:companyId", Auth, hasRole(ROLES.ADMIN), controller.company.verification);

router.get("/unverified/companies", Auth, hasRole(ROLES.ADMIN), controller.company.allUnveried);

// rider routes
router.get("/rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.rider.allByAdmin);
// get all riders for a company
router.get("/:company/rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.admin.allRider);
// get a single rider
router.get("/rider/:rider", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.admin.singleRider);
// suspend a rider account
router.patch("/rider/:rider/status", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.rider.status);
// check if a rider is with package or not
router.get(
  "/rider/withpackage/:riderId",
  Auth,
  hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  controller.rider.checkDriverTripStatus
);



// settings
// get settings
router.get("/setting", Auth, hasRole([ROLES.ADMIN]), controller.setting.getAdmin);
// patch settings
router.patch("/setting", Auth, hasRole([ROLES.ADMIN]), controller.setting.updateAdmin);



//user routes
router.get("/user/all", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.admin.allUsers);
router.get("/user/:userId", Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), controller.admin.singleUser);

// Admin Updates
router.put("/update", Auth, controller.admin.updateMe);
router.patch("/password", Auth, controller.admin.password);
router.patch("/:adminId/disable", Auth, hasRole(), controller.admin.disable);
router.patch("/:adminId/enable", Auth, hasRole(), controller.admin.enable);
router.delete("/:adminId", Auth, hasRole(), controller.admin.destroy);


// INFO-METRICS
// General statistics
router.get("/statistics", [Auth, hasRole([ROLES.ADMIN])], controller.admin.getGeneralStats);
// Get recent activities
router.get("/recent-activities", [Auth, hasRole([ROLES.ADMIN])], controller.admin.getRecentActivities);
//orders
router.get("/info/order-stats", Auth, hasRole([ROLES.ADMIN]), controller.info.orderStatistics);
//revenue
router.get("/info/revenue", Auth, hasRole([ROLES.ADMIN]), controller.info.revenue);

// Enterprise Info
router.get("/enterprise/statistics", [Auth, hasRole([ROLES.ADMIN])], controller.admin.getEnterpriseStatistics);
router.get("/enterprise/orders/pending", [Auth, hasRole([ROLES.ADMIN])], controller.admin.getPendingEnterpriseOrders);

// Enterprise Updates
router.patch("/:branchId/verify", [Auth, hasRole([ROLES.ADMIN])], controller.admin.verifyBranch);



// industry Category
router.post("/industry-category", [Auth, hasRole([ROLES.ADMIN])], controller.industryCategory.create);
router.get("/industry-category", controller.industryCategory.all);


// credit
router.post(
  "/fund-credit",
  [Auth, hasRole([ROLES.ADMIN])],
  controller.credit.lineOfCredit
);
router.get(
  "/credit",
  [Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT])],
  controller.credit.getAllCredit
);
router.post(
  "/credit/approval",
  [Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT])],
  controller.credit.approveByAdminCredit
);

// wallet
// get all enterprise wallet
router.get(
  "/wallet/all",
  [Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT])],
  controller.wallet.getWalletByAdmin
);
// disable a wallet account
router.patch(
  "/wallet/status/:wallet",
  [Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT])],
  controller.wallet.disableWallet
);
// a wallet history of for a particular wallet
router.get(
  "/wallet/history/:wallet",
  [Auth, hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT])],
  controller.wallet.singleWalletHistory
);


// Enterprise accounts management
router.get("/enterprise/accounts", [Auth, hasRole([ROLES.ADMIN])], controller.admin.getEnterpriseAccounts);

module.exports = router;
