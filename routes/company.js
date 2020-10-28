const express = require("express");
const router = express.Router();

const company = require("../controllers/company");
const auth = require("../controllers/auth");
const { Auth } = require("../middlewares/auth");
const rider = require("../controllers/rider");
const { ACCOUNT_TYPES } = require("../constant/types");

router.post("/login", auth.login.companyLogin);

// Rider routes
router.post("/riders", Auth(ACCOUNT_TYPES.COMPANY), rider.create.create);

router.get("/riders", Auth(ACCOUNT_TYPES.COMPANY), rider.get.all);

router.get("/riders/:riderId", Auth(ACCOUNT_TYPES.COMPANY), rider.get.single);

router.put("/riders/:riderId", Auth(ACCOUNT_TYPES.COMPANY), rider.update.updateSingle);

router.delete("/riders/:riderId", Auth(ACCOUNT_TYPES.COMPANY), rider.delete.destroy);

module.exports = router;
