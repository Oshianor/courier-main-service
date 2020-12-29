const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { CompanyAuth } = require("../middlewares/auth")

// card routes
router.post("/", [CompanyAuth], controller.card.add);
router.get("/", [CompanyAuth], controller.card.all);
router.get("/:cardId", [CompanyAuth], controller.card.single);


module.exports = router;