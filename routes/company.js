const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { Auth } = require("../middlewares/auth");

// company
// create a company
router.post("/", controller.company.company);


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

// Riders Request
router.get("/request/riders", Auth, controller.rider.requests);
router.put("/request/:requestId/respond", Auth, controller.rider.respond);


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


module.exports = router;
