const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth, Auth } = require("../middlewares/auth");

// Create entry
router.post("/", UserAuth, controller.entry.localEntry);
// approve an entry for different payment method
router.post("/confirm", UserAuth, controller.entry.transaction);
// rider confirm cash payment
router.patch("/cash/payment", UserAuth, controller.entry.riderConfirmPayment);

router.get("/pool", Auth, controller.entry.byCompany);

router.get("/:id", Auth, controller.entry.singleEntry);
// compnay accept entry
router.patch("/company/accept/:entry", Auth, controller.entry.companyAcceptEntry);
// compnay accept entry
router.get("/company/online/:entry", Auth, controller.entry.allOnlineRiderCompanyEntry);

router.post("/rider-assign/:entry", Auth, controller.entry.AsignRiderToEntry);

module.exports = router;
