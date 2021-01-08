const jwt = require("jsonwebtoken");
const config = require("config");
const User = require("../models/users");
const Enterprise = require("../models/enterprise");
const Company = require("../models/company");
const AdminService = require("../services/admin");
const UserService = require("../services/user");
const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../constant/types");


const ROLES = {
  SUPER_ADMIN: "superAdmin",
  ADMIN: "admin",
  ACCOUNTANT: "accountant",
};

const E_ROLES = {
  OWNER: "owner",
  BRANCH: "branch",
  MAINTAINER: "maintainer",
};

/**
 * 
 * @param {Array} roles Passing an array of string.
 */
const hasRole = (roles = []) => {
  return async (req, res, next) => {

    const adminInstance = new AdminService();
    const admin = await adminInstance.get({
      _id: req.user.id,
      status: "active",
      verified: true,
    });

    // let admin = await Admin.findOne();
    if (!admin) return JsonResponse(res, 401, "Unauthenticated");

    if (admin.role === ROLES.SUPER_ADMIN) {
      next();
    } else {
      if (roles.length < 1) {
        return JsonResponse(res, 403, MSG_TYPES.PERMISSION);
      }
      for (let role of roles) {
        if (admin.role === role) {
          next();
        } else {
          return JsonResponse(res, 403, MSG_TYPES.PERMISSION);
        }
      }
    }
  };
};

// auth middleware
const Auth = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token)
    return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED);

  try {
    const decoded = jwt.verify(token, config.get("application.jwt.key"));

    req.user = decoded;
    req.token = token;
    next();
  } catch (ex) {
    console.log(ex);
    if (ex.msg) {
      return JsonResponse(res, 401, ex.msg);
    }
    res.status(406).send();
  }
};

// company auth middleware
const CompanyAuth = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token)
    return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED);
  try {
    const decoded = jwt.verify(token, config.get("application.jwt.key"));
    req.user = decoded;

    const company = await Company.findById(decoded.id);
    if (!company) return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED);

    req.body.company = decoded.id
    next();
  } catch (ex) {
    console.log(ex);
    if (ex.msg) {
      return JsonResponse(res, 401, ex.msg);
    }
    res.status(406).send();
  }
};

const SocketAuth = (socket, next) => {
  try {
    const token = socket.handshake.query.token ?? "";

    if (token === "") throw new Error("Auth token is required");

    const decoded = jwt.verify(token, config.get("application.jwt.key"));

    socket.user = decoded;
    next();
  } catch (ex) {
    console.log("error", ex);

    next(new Error("Auth token is required"));
  }
};

const UserAuth = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED);

  try {
    // call user account service to get details
    const userInstance = new UserService();
    const userParent = await userInstance.get(token);

    req.user = userParent.data;
    req.user.id = req.user._id;
    req.token = token;
    delete req.user._id;
    next();
  } catch (ex) {
    console.log('Exception', ex);
    if (ex.msg) {
      return JsonResponse(res, 401, ex.msg);
    }
    return JsonResponse(res, 406, MSG_TYPES.SERVER_ERROR);
  }
};

const EnterpriseAuth = (roles = []) => {
  return async (req, res, next) => {
    if (req.user.group !== "enterprise") return JsonResponse(res, 403, MSG_TYPES.NOT_ALLOWED);

    const user = await User.findOne({
      _id: req.user.id,
      enterprise: { $ne: null },
      group: "enterprise"
    }).populate('enterprise');

    if (!user) return JsonResponse(res, 400, MSG_TYPES.NO_ENTERPRISE);

    req.user.enterprise = user.enterprise;
    req.user.role = user.role;

    if (user.role === E_ROLES.OWNER) {
      next();
    } else {
      if (roles.length < 1) {
        return JsonResponse(res, 403, MSG_TYPES.PERMISSION);
      }
      if (roles.includes(user.role)) {
        next();
        return;
      } else {
        return JsonResponse(res, 403, MSG_TYPES.PERMISSION);
      }
    }
  }
};

const isExaltService = async (req, res, next) => {
  const serviceKey = req.header("api-key");
  if (serviceKey && serviceKey === config.get("api.key")) {
    return next();
  }
  return JsonResponse(res, 403, MSG_TYPES.NOT_ALLOWED);
}


module.exports = {
  Auth,
  hasRole,
  ROLES,
  UserAuth,
  SocketAuth,
  isExaltService,
  CompanyAuth,
  EnterpriseAuth,
  E_ROLES
};
