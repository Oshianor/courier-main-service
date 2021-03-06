const config = require("config");
const bcrypt = require("bcrypt");
const Company = require("../models/company");
const Rider = require("../models/rider");
const Admin = require("../models/admin");
const { validateAdminLogin, validateVerifyAccount } = require("../request/admin");
const { validateCompanyLogin, validateVerifyCompany } = require("../request/company");
const { validateRiderLogin } = require("../request/rider");
const {
  validatePasswordUpdate,
  validateForgotPassword,
  validateUserLogin,
  validateUserStatusUpdate,

  validateForgotPassword2,
  validateResetPassword2
} = require("../request/auth");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/types");
const AuthService = require("../services/auth");
const { redisClient } = require("../utils");

/**
 * Company Login
 * @param {*} req
 * @param {*} res
 */
exports.companyLogin = async (req, res, next) => {
  try {
    const { error } = validateCompanyLogin(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message);
    }

    const company = await Company.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
    })
      .populate("vehicles")
      .populate("tier", "name type price transactionCost priority");
    if (!company)
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_INVALID);

    if (company.deleted) {
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_DELETED);
    }

    if (company.status === "suspended") {
      return JsonResponse(res, 401, MSG_TYPES.SUSPENDED);
    }

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(
      req.body.password,
      company.password
    );
    if (!validPassword)
      return JsonResponse(res, 400, MSG_TYPES.ACCOUNT_INVALID);

    const token = company.generateToken();

    company.password = "";
    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, company, null);
    return;
  } catch (error) {
    console.log(error);
    next(error)
  }
};

/**
 * Company Login
 * @param {*} req
 * @param {*} res
 */
exports.adminLogin = async (req, res, next) => {
  try {
    const { error } = validateAdminLogin(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message);
    }

    const admin = await Admin.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
      status: "active"
    });
    if (!admin)
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_INVALID);

    if (admin.deleted) {
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_DELETED);
    }

    if (admin.status === "suspended") {
      return JsonResponse(res, 401, MSG_TYPES.SUSPENDED);
    }

    // if (admin.disabled) {
    //   return JsonResponse(res, 401, MSG_TYPES.DISABLED);
    // }

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(req.body.password, admin.password);
    if (!validPassword)
      return JsonResponse(res, 400, MSG_TYPES.ACCOUNT_INVALID);

    const token = admin.generateToken();

    admin.password = "";
    res.header("x-auth-token", token);
    JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, admin, null);
    return;
  } catch (error) {
    console.log(error);
    next(error)
  }
};

/**
 * Rider Login
 * @param {*} req
 * @param {*} res
 */
exports.riderLogin = async (req, res, next) => {
  try {
    const { error } = validateRiderLogin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const rider = await Rider.findOne({
      email: req.body.email.toLowerCase(),
      verified: true,
    })
      // .populate("company", "name email")
      .populate("vehicle");
    if (!rider)
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_INVALID);

    if (rider.deleted) {
      return JsonResponse(res, 401, MSG_TYPES.ACCOUNT_DELETED);
    }

    if (rider.status === "suspended") {
      return JsonResponse(res, 401, MSG_TYPES.SUSPENDED);
    }

    if (!rider.company) {
      return JsonResponse(res, 400, "You can't login because you've not been assigned to a company");
    }

    // compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(req.body.password, rider.password);
    if (!validPassword){
      return JsonResponse(res, 400, MSG_TYPES.ACCOUNT_INVALID);
    }

    const token = rider.generateToken();
    const riderId = rider._id.toString();

    redisClient.hset('RIDER_AUTH_TOKENS', riderId, token, (error, result) => {
      if(error){
        console.log("Failed to set rider token in redis: ", error);
        return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR);
      }

      rider.password = "";
      res.header("x-auth-token", token);
      return JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, rider, null);
    });

  } catch (error) {
    console.log(error);
    next(error)
  }
};

/**
 * Verify rider and admin account
 * @param {*} req
 * @param {*} res
 */
exports.accountVerify = async (req, res, next) => {
  try {
    const { error } = validateVerifyAccount(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

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
      if (!admin)
        return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      await admin.updateOne(dataUpdate);
    } else if (req.body.type === "rider") {
      const rider = await Rider.findOne(dataReq);
      if (!rider)
        return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);
      await rider.updateOne(dataUpdate);
    }

    JsonResponse(res, null, MSG_TYPES.ACCOUNT_VERIFIED);
  } catch (error) {
    console.log(error);
    next(error)
  }
};

/**
 * Verify company accounts
 * @param {*} req
 * @param {*} res
 */
exports.companyVerify = async (req, res, next) => {
  try {
    const { error } = validateVerifyCompany(req.query);
    if (error)
      return JsonResponse(res, 400, error.details[0].message);

    const currentDate = new Date();
    const company = await Company.findOne({
      email: req.query.email,
      "rememberToken.token": req.query.token,
      verified: false,
      emailVerified: false,
      "rememberToken.expiredDate": { $gte: currentDate },
    });
    if (!company)
      return JsonResponse(res, 404, MSG_TYPES.NOT_FOUND);

    await company.updateOne({
      emailVerified: true,
      rememberToken: null,
      status: "inactive",
    });

    return JsonResponse(res, 200, MSG_TYPES.AWAIT_ADMIN);
    // return res.send({msg: MSG_TYPES.AWAIT_ADMIN});
  } catch (error) {
    console.log(error);
    next(error)
  }
};

/**
 * Update password
 * @param {*} req
 * @param {*} res
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { error } = validatePasswordUpdate(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    req.body.rider = req.user.id

    const authInstance = new AuthService();
    await authInstance.updatePassword(req.body)

    return JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    console.log(error);
    return JsonResponse(res, error.code, error.msg);
  }
};


/**
 * Forgot-Pass email verification
 * @param {*} req
 * @param {*} res
 */
exports.validateEmail = async (req, res, next) => {
  try {
    const { error } = validateForgotPassword(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const authInstance = new AuthService();
    await authInstance.forgotPassEmailValidate(req.body.email)

    return JsonResponse(res, 200, "An OTP has been sent to your email");
  } catch (error) {
    console.log(error);
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Forgot-Pass OTP validation
 * @param {*} req
 * @param {*} res
 */
exports.validateOTP = async (req, res, next) => {
  try {
    const { error } = validateForgotPassword(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const authInstance = new AuthService();
    await authInstance.forgotPassOTPValidate(req.body.email, req.body.otp)

    return JsonResponse(res, 200, "Validation Successfull");
  } catch (error) {
    console.log(error);
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Forgot-Pass password reset
 * @param {*} req
 * @param {*} res
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { error } = validateForgotPassword(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const authInstance = new AuthService();
    await authInstance.resetPassword(req.body.email, req.body.password)

    return JsonResponse(res, 200, MSG_TYPES.UPDATED);
  } catch (error) {
    console.log(error);
    return JsonResponse(res, error.code, error.msg);
  }
};

/**
 * Set Pass - For enterprise set-up
 * @param {*} req
 * @param {*} res
 */
exports.setPassword = async (req, res, next) => {
  try {

    const authInstance = new AuthService();
    await authInstance.setPassword(req.body)

    return JsonResponse(res, 200, MSG_TYPES.ACCOUNT_VERIFIED);
  } catch (error) {
    next(error);
    return
  }
};

// [moved > accounts-service]
/**
 * Enterprise login
 * @param {*} req
 * @param {*} res
 */
// exports.enterpriseLogin = async (req, res, next) => {
//   try {
//     const { error } = validateUserLogin(req.body);
//     if (error) return JsonResponse(res, 400, error.details[0].message);

//     const authInstance = new AuthService();
//     const {
//       token,
//       localUser,
//     } = await authInstance.enterpriseLogin(req.body);

//     // localUser.enterprise = enterpriseUser;
//     res.header("x-auth-token", token);
//     return JsonResponse(res, 200, MSG_TYPES.LOGGED_IN, localUser);
//   } catch (error) {
//     next(error)
//     return
//   }
// };


// [moved > accounts-service]
/**
 * Update enterprise status
 * @param {*} req
 * @param {*} res
 */
// exports.updateEnterpriseAccountStatus = async (req, res, next) => {
//   try {
//     const { error } = validateUserStatusUpdate(req.body);
//     if (error) return JsonResponse(res, 400, error.details[0].message);

//     const authInstance = new AuthService();
//     await authInstance.updateEnterpriseAccountStatus(req.body, req.user);

//     return JsonResponse(res, 200, MSG_TYPES.UPDATED);
//   } catch (error) {
//     next(error);
//     return;
//   }
// };

// [moved > accounts-service]
/**
 * Update user status by admin
 * @param {*} req
 * @param {*} res
 */
// exports.updateUserStatus = async (req, res, next) => {
//   try {
//     const { error } = validateUserStatusUpdate(req.body);
//     if (error) return JsonResponse(res, 400, error.details[0].message);

//     const authInstance = new AuthService();
//     await authInstance.updateUserStatus(req.body);

//     return JsonResponse(res, 200, MSG_TYPES.UPDATED);
//   } catch (error) {
//     next(error)
//     return
//   }
// };


/**
 * Forgot-Pass email verification
 * @param {*} req
 * @param {*} res
 */
exports.forgotPassword2 = async (req, res) => {
  try {
    const { error } = validateForgotPassword2(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const { email, userType, verificationMode } = req.body;
    const authInstance = new AuthService();
    await authInstance.forgotPassword2(email, userType, verificationMode);

    const verificationDevice = verificationMode === "otp" ? "phone" : "mail"
    return JsonResponse(res, 200, `An Account recovery message has been sent to your ${verificationDevice}`);
  } catch (error) {
    console.log(error);
    return JsonResponse(res, error.code || 500, error.msg || MSG_TYPES.SERVER_ERROR);
  }
};

/**
 * Reset user password with token [phone otp or email verification]
 * @param {*} req
 * @param {*} res
 * @returns
 */
exports.resetPassword2 = async (req, res, next) => {
  try {
    const { error } = validateResetPassword2(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message);

    const { email, userType, token, password } = req.body;
    const authInstance = new AuthService();
    await authInstance.resetPassword2(email, userType, token, password);

    return JsonResponse(res, 200, "Password reset successfully");
  } catch (error) {
    console.log(error);
    return JsonResponse(res, error.code || 500, error.msg || MSG_TYPES.SERVER_ERROR);
  }
}

