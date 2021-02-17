/**
 * This File contains all Line Of Credit Related Routes
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const {
  isExaltService,
} = require("../middlewares/auth");

// create wallet account for enterprise
router.post("/", isExaltService, controller.credit.createCredit);

module.exports = router;
