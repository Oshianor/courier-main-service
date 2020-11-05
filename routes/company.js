const express = require("express");
const router = express.Router();

const company = require("../controllers/company");
const { Auth } = require("../middlewares/auth");
const rider = require("../controllers/rider");
const { ACCOUNT_TYPES } = require("../constant/types");

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

module.exports = router;
