const express = require("express");
const router = express.Router();

const company = require("../controllers/company");
const { Auth } = require("../middlewares/auth");
const rider = require("../controllers/rider");
const { ACCOUNT_TYPES } = require("../constant/types");


// company routes
router.get("/me", Auth, company.get.me);


// Rider routes
router.post("/riders", Auth, rider.create.create);

router.get("/riders", Auth, rider.get.all);

router.get("/riders/:riderId", Auth, rider.get.single);

router.put("/riders/:riderId", Auth, rider.update.updateSingle);

router.delete("/riders/:riderId", Auth, rider.delete.destroy);

module.exports = router;
