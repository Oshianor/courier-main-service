const express = require("express");
const router = express.Router();
const controller = require("../controllers");
const { Auth } = require("../middlewares/auth");


//create bank detail
router.post("/", [Auth], controller.bank.create)

// Get bank list
router.get("/list", [Auth], controller.bank.listBanks);

// Resolve (Confirm) an account number
router.get("/confirm", [Auth], controller.bank.resolveAccount);

//get all banks
router.get("/", [Auth], controller.bank.getAll)

//delete bank details
router.delete("/", [Auth], controller.bank.deleteBank)

//set default bank detail
router.patch("/set-default", [Auth], controller.bank.setDefault)


module.exports = router;