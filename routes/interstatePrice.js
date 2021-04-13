const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");
router.post("/address/create", Auth, controller.interstatePrice.createInterstateAddress);
router.post("/price/create", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.createDropoffPrice);
router.get("/address/find", Auth, controller.interstatePrice.getInterstateAddress);
router.patch("/address/status/:id", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.changeInterstateAddressStatus);
router.delete("/address/delete/:id", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.deleteInterstateAddress);
router.get("/address/all", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getAllInterstateAddress);
router.patch("/address/update/:id", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.updateInterstateAddress);
router.get("/price/all", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getAllInterstateDropOff);
router.delete("/price/delete/:id", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.deleteInterstateDropOffPrice);
router.patch("/price/update/:id", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.updateDropOffPrice);

router.get("/address/price", Auth, controller.interstatePrice.getDropOffLocationPrices);

module.exports = router;