const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

router.post("/create", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.create);
router.get("/all", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getAll);
router.get("/single", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.getById);
router.delete("/delete", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.delete);
router.put("/edit", Auth, hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), controller.interstatePrice.update);

module.exports = router;