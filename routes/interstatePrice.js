const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

router.post("/create", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.create);
router.post("/company/create", Auth, controller.interstatePrice.createCompanyInterstatePrice);
router.get("/all", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getAll);
router.get("/company/all", Auth, controller.interstatePrice.getAllCompanyInterstatePrice);
router.get("/single", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getById);
router.get("/company/single", Auth, controller.interstatePrice.getCompanyInterStatePriceById);
router.delete("/delete", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.delete);
router.delete("/company/delete", Auth, controller.interstatePrice.deleteCompanyInterstatePrice);
router.patch("/edit/:id", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.update);
router.put("/company/edit", Auth, controller.interstatePrice.updateCompanyInterstatePrice);

module.exports = router;