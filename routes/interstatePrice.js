const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// router.post("/create", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.create);
// router.post("/company/create", Auth, controller.interstatePrice.createCompanyInterstatePrice);
// router.get("/all", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getAll);
// router.get("/company/all", Auth, controller.interstatePrice.getAllCompanyInterstatePrice);
// router.get("/single", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getById);
// router.get("/company/single", Auth, controller.interstatePrice.getCompanyInterStatePriceById);
// router.delete("/delete", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.delete);
// router.delete("/company/delete", Auth, controller.interstatePrice.deleteCompanyInterstatePrice);
// router.patch("/edit/:id", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.update);
// router.patch("/company/edit/:id", Auth, controller.interstatePrice.updateCompanyInterstatePrice);
router.post("/address/create", Auth, controller.interstatePrice.createInterstateAddress);
router.post("/price/create", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.createDropoffPrice);
router.get("/address/find", Auth, controller.interstatePrice.getInterstateAddress);
router.patch("/address/status/:id", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.changeInterstateAddressStatus);
router.get("/address/all", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getAllInterstateAddress);
router.get("/price/all", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getAllInterstateDropOff);

module.exports = router;