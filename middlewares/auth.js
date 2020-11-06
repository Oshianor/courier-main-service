const jwt = require("jsonwebtoken");
const { JsonResponse } = require("../lib/apiResponse");
const config = require("config");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../constant/types");
const { Admin } = require("../models/admin");
const { User } = require("../models/users");
const service = require("../services");
const ROLES = {
  SUPER_ADMIN: "superAdmin",
  ADMIN: "admin",
  ACCOUNTANT: "accountant"
};

/*
 * @param array of strings
 */
const hasRole = (roles = []) => {
  return async (req, res, next) => {
    let admin = await Admin.findOne({ _id: req.user.id, status: "active", verified: true });
    if (!admin) return JsonResponse(res, 401, "Unauthenticated", null, null);

    if (admin.role === ROLES.SUPER_ADMIN) {
      next();
    } else {
      if (roles.length < 1) {
        return JsonResponse(res, 403, MSG_TYPES.PERMISSION, null, null);
      }
      for (let role of roles) {
        if (admin.role === role) {
          next();
        } else {
          return JsonResponse(res, 403, MSG_TYPES.PERMISSION, null, null);
        }
      }
    }
  };
};

// auth middleware
const Auth = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED, null, null);

  try {
    const decoded = jwt.verify(token, config.get("application.jwt.key"));

    req.user = decoded;
    next();
  } catch (ex) {
    console.log(ex);
    if (ex.msg) {
      return JsonResponse(res, 401, ex.msg, null, null);
    }
    res.status(406).send();
  }
};


const UserAuth = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED, null, null);

  try {
    // call user account service to get details
    const userParent = await service.user.get(token);

    // console.log("userParent", userParent);

    // const user = await User.findOne({ userId: userParent._id })
    // if (!user) {
    //   userParent.userId = userParent._id;
    //   await User.create(userParent);
    // }
    req.user = userParent;
    req.user.id = req.user._id;
    delete req.user._id;
    next();
  } catch (ex) {
    console.log(ex);
    if (ex.msg) {
      return JsonResponse(res, 401, ex.msg, null, null);
    }
    res.status(406).send();
  }
};

module.exports = {
  Auth,
  hasRole,
  ROLES,
  UserAuth,
};
