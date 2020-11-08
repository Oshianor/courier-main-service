const express = require("express");
const router = express.Router();
const setting = require("../controllers/setting");
const company = require("../controllers/company");
const { Auth } = require("../middlewares/auth");
const rider = require("../controllers/rider");
const dp = require("../controllers/distancePrice");

// company
// create a company
router.post("/", company.create.company);


// company routes
router.get("/me", Auth, company.get.me);

// Rider routes
router.post("/riders", Auth, rider.create.create);

router.get("/riders", Auth, rider.get.all);

router.get("/riders/:riderId", Auth, rider.get.single);

router.put("/riders/:riderId", Auth, rider.update.updateSingle);

router.put("/riders/:riderId/respond", Auth, rider.update.respond);

router.delete("/riders/:riderId", Auth, rider.delete.destroy);

// Riders Request
router.get("/request/riders", Auth, rider.get.requests);
router.put("/request/:requestId/respond", Auth, rider.update.respond);


// settings
// get settings
router.get("/setting", Auth, setting.get.company);
// patch settings
router.patch("/setting", Auth, setting.update.company);

// distance pricing
// add distance price by a company
router.post("/distance-price", Auth, dp.create.company);
// get all the distance price added
router.get("/distance-price", Auth, dp.get.company);
// update distance price for a location and vehicle
router.patch("/distance-price/:dp", Auth, dp.update.company);
// delete distance price for a location and vehicle
router.delete("/distance-price/:dp", Auth, dp.delete.company);



module.exports = router;
