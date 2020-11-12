const express = require("express");
const router = express.Router();
const entry = require("../controllers/entry");
const { UserAuth, Auth } = require("../middlewares/auth");

// Create entry
router.post("/", UserAuth, entry.create.localEntry);
// approve an entry for different payment method
router.post("/confirm", UserAuth, entry.create.transaction);
// rider confirm cash payment
router.patch("/cash/payment", UserAuth, entry.create.riderConfirmPayment);

router.get("/pool", Auth, entry.get.byCompany);

router.get("/:id", Auth, entry.get.singleEntry);
// compnay accept entry
router.patch("/company/accept/:entry", Auth, entry.update.companyAcceptEntry);
// compnay accept entry
router.get("/company/online/:entry", Auth, entry.get.allOnlineRiderCompanyEntry);


module.exports = router;
