const express = require("express");
const router = express.Router();
const entry = require("../controllers/entry")
const { UserAuth } = require("../middlewares/auth")

// Create entry
router.post("/", UserAuth, entry.create.localEntry);

module.exports = router;
