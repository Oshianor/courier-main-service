const express = require("express");
const router = express.Router();
const { CreateUser } = require("../controllers/user/create");
const { GetUser } = require("../controllers/user/get");
const { Auth } = require("../middlewares/auth");
const { ACCOUNT_TYPES } = require("../constant/types");

// Create a new user
router.post("/", CreateUser);
// get user details
router.get("/", Auth(ACCOUNT_TYPES.USER), GetUser);

module.exports = router;
