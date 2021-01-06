const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { hasRole, ROLES, Auth } = require("../middlewares/auth");

// create organisation
router.post("/create-organization", [Auth, hasRole([ROLES.ADMIN])], controller.enterprise.createOrganization);

// create branch
router.post("/create-branch", [Auth, hasRole([ROLES.ADMIN])], controller.enterprise.createBranch);

// create maintainer
router.post("/create-maintainer", [Auth, hasRole([ROLES.ADMIN])], controller.enterprise.createMaintainer);

module.exports = router;