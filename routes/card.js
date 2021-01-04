const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { CompanyAuth } = require("../middlewares/auth")

// CARD ROUTES

// Add card
router.post("/", [CompanyAuth], controller.card.add);
// Get all cards
router.get("/", [CompanyAuth], controller.card.all);
// Get one card
router.get("/:cardId", [CompanyAuth], controller.card.single);
// delete one card
router.delete("/:cardId", [CompanyAuth], controller.card.delete);


module.exports = router;