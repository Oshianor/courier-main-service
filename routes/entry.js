const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { UserAuth, Auth } = require("../middlewares/auth");

// Create entry
router.post("/", UserAuth, controller.entry.localEntry);
// approve an entry for different payment method
router.post("/confirm", UserAuth, controller.entry.transaction);

router.get("/pool", Auth, controller.entry.byCompany);

router.get("/:id", Auth, controller.entry.singleEntry);
// compnay accept entry
router.patch("/company/accept/:entry", Auth, controller.entry.companyAcceptEntry);
// compnay accept entry
router.get("/company/online/:entry", Auth, controller.entry.allOnlineRiderCompanyEntry);

router.post("/rider-assign/:entry", Auth, controller.entry.riderAssignToEntry);

router.post("/rider-accept", Auth, controller.entry.riderAcceptEntry);

router.post("/rider-reject", Auth, controller.entry.riderRejectEntry);

router.post("/enroute-pickup", Auth, controller.entry.riderStartPickup);

router.post("/arrived-pickup", Auth, controller.entry.riderArriveAtPickup);

// rider confirm cash payment
router.post("/confirm/cash-payment", Auth, controller.entry.riderConfirmCashPayment);

router.post("/confirm-pickup", Auth, controller.entry.riderComfirmPickupOTPCode);



module.exports = router;
