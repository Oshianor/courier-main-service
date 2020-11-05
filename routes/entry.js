const express = require("express");
const router = express.Router();
const entry = require("../controllers/entry")


// Create entry
router.post("/", entry.create.localEntry);

module.exports = router;
