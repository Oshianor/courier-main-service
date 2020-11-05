// const { validateVerifyAccount } = require("../../models/account");
// const Account = require("../../services/accountService");

const bcrypt = require("bcrypt");
const config = require("config");
const { MSG_TYPES } = require("../../constant/types");
const { JsonResponse } = require("../../lib/apiResponse");
const { Admin, validateVerifyAccount } = require("../../models/admin")
const { Company, validateVerifyCompany } = require("../../models/company");
const { Organization } = require("../../models/organization");
const { Rider } = require("../../models/rider");

exports.account = async (req, res) => {
  try {
    const { error } = validateVerifyAccount(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message, null, null);

    const currentDate = new Date();
    const password = await bcrypt.hash(req.body.password, 10);

    const dataReq = {
      email: req.body.email,
      "rememberToken.token": req.body.token,
      verified: false,
      emailVerified: false,
      "rememberToken.expiredDate": { $gte: currentDate },
    };

    const dataUpdate = {
      verified: true,
      emailVerified: true,
      rememberToken: null,
      password,
      status: "active",
    };

    if (req.body.type === "admin") {
      const admin = await Admin.findOne(dataReq);
      if (!admin) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      await admin.updateOne(dataUpdate);
    } else if (req.body.type === "rider") {
      const rider = await Rider.findOne({...dataReq, verificationType: "email" });
      if (!rider) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      await rider.updateOne(dataUpdate);
    }
    
    JsonResponse(res, null, MSG_TYPES.ACCOUNT_VERIFIED, null, null);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
};



exports.company = async (req, res) => {
  try {
    const { error } = validateVerifyCompany(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    const currentDate = new Date();
    const company = await Company.findOne({
      email: req.body.email,
      "rememberToken.token": req.body.token,
      verified: false,
      emailVerified: false,
      "rememberToken.expiredDate": { $gte: currentDate },
    });
    if (!company) return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);

    await company.updateOne({
      emailVerified: true,
      rememberToken: null,
      status: "inactive",
    });

    

    JsonResponse(res, null, "Account successfully verified. Awaiting administrator verification.", null, null);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
};
