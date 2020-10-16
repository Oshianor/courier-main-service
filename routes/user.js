const express = require("express");
const router = express.Router();
const { CreateUser } = require("../controllers/user/create");
const { GetUser } = require("../controllers/user/get");
const { Auth } = require("../middlewares/auth")

// Create a new user
router.post("/", CreateUser);
// get user details
router.get("/", Auth, GetUser)




module.exports = router;