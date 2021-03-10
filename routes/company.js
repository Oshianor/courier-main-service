const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { Auth } = require("../middlewares/auth");

// company

// create a company
router.post("/", controller.company.company);
router.patch("/", Auth, controller.company.updateSingle);

// company routes
router.get("/me", Auth, controller.company.me);
// recruiting companies
router.get("/recruiting", controller.company.recruiting);

// Rider routes
router.post("/riders", Auth, controller.rider.create);

router.get("/riders", Auth, controller.rider.all);

router.get("/riders/:riderId", Auth, controller.rider.single);

router.put("/riders/:riderId", Auth, controller.rider.updateSingle);

router.put("/riders/:riderId/respond", Auth, controller.rider.respond);

router.delete("/riders/:riderId", Auth, controller.rider.destroy);

router.patch("/riders/:riderId/suspend", Auth, controller.rider.suspend);
router.patch("/riders/:riderId/unsuspend", Auth, controller.rider.unsuspend);
router.get("/riders/:riderId/orders", Auth, controller.rider.getRiderOrders);
router.get("/riders/:riderId/statistics", Auth, controller.rider.getRiderStatistics);
router.get("/riders/:riderId/transactions", Auth, controller.rider.getRiderTransactions);

router.patch("/riders/:riderId/orders/:orderId/cancel", Auth, controller.company.removeOrderFromRiderBasket);

// Riders Request
router.get("/request/riders", Auth, controller.rider.requests);
router.post("/request/:requestId", Auth, controller.rider.respond);


// settings
// get settings
router.get("/setting", Auth, controller.setting.getCompany);
// patch settings
router.patch("/setting", Auth, controller.setting.updateCompany);

// distance pricing
// add distance price by a company
router.post("/distance-price", Auth, controller.distancePrice.company);
// get all the distance price added
router.get("/distance-price", Auth, controller.distancePrice.getCompany);
// update distance price for a location and vehicle
router.patch("/distance-price/:dp", Auth, controller.distancePrice.updateCompany);
// delete distance price for a location and vehicle
router.delete("/distance-price/:dp", Auth, controller.distancePrice.deleteCompany);

//get all transactions for a company
router.get("/transactions",Auth,controller.company.allTransactions)


// get all entries
router.get("/entry", Auth, controller.company.entries);

router.get("/entry/:entryId", Auth, controller.company.getSingleEntry);

// Order management routes - These are supposed to be customized pool endpoints
// router.get("/:companyId/orders/statistics", Auth, controller.order.getCompanyOrderStats);
// router.patch("/:companyId/orders/:orderId/decline", Auth, controller.order.decline);
// router.delete("/:companyId/orders/:orderId", Auth, controller.order.delete);
// router.patch("/:companyId/orders/:orderId/assign/:riderId", Auth, controller.order.assignOrderToRider);

router.get("/:companyId/orders", Auth, controller.order.getCompanyOrders);

// Dashboard statistics
router.get("/:companyId/statistics", Auth, controller.company.getStatistics);
router.get("/:companyId/riders/statistics", Auth, controller.company.getRiderStatistics);
router.get("/:companyId/transactions/statistics", Auth, controller.company.getTransactionStatistics);

// update company
router.patch("/password", Auth, controller.company.changePassword);


module.exports = router;
