const { Account, validateVerifyAccount } = require("../../models/account");

const bcrypt = require("bcrypt");
const config = require("config");
const { MSG_TYPES } = require("../../constant/types");
const { JsonResponse } = require("../../lib/apiResponse");

exports.company = async (req, res) => {
  try {
    const { error } = validateVerifyAccount(req.body);

    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const currentDate = new Date();

    const account = await Account.findOne({
      email: req.body.email,
      "rememberToken.token": req.body.token,
      verified: false,
      emailVerified: false,
      "rememberToken.expiredDate": { $gte: currentDate },
    });

    if (!account)
      return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    const password = await bcrypt.hash(req.body.password, 10);

    await account.updateOne({
      verified: true,
      emailVerified: true,
      rememberToken: null,
      password,
      status: "active"
    });

    JsonResponse(res, null, MSG_TYPES.ACCOUNT_VERIFIED, null, null);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
};
