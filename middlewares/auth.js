const jwt = require("jsonwebtoken");
const { JsonResponse } = require("../lib/apiResponse");
const config = require("config");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../constant/types");
const User = require("../models/users");
const Company = require("../models/company");
const { Container } = require("typedi");
const AdminService = require("../services/admin");
const UserService = require("../services/user");

const ROLES = {
  SUPER_ADMIN: "superAdmin",
  ADMIN: "admin",
  ACCOUNTANT: "accountant",
};

/*
 * @param array of strings
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
  if (!token)
    return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED, null, null);

  try {
    const decoded = jwt.verify(token, config.get("application.jwt.key"));
    console.log(decoded)

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

// company auth middleware
const CompanyAuth = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token)
    return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED, null, null);
  try {
    const decoded = jwt.verify(token, config.get("application.jwt.key"));
    req.user = decoded;

    const company = await Company.findById(decoded.id);
    if (!company) return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED, null, null);

    req.body.company = decoded.id
    next();
  } catch (ex) {
    console.log(ex);
    if (ex.msg) {
      return JsonResponse(res, 401, ex.msg, null, null);
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
  if (!token)
    return JsonResponse(res, 401, MSG_TYPES.ACCESS_DENIED);

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
      return JsonResponse(res, 401, ex.msg, null, null);
    }
    res.status(406).send();
  }
};


const EnterpriseAuth = async (req, res, next) => {
  try {

    if (req.user.group !== "enterprise") return JsonResponse(res, 403, MSG_TYPES.NOT_ALLOWED);
    
    const 
    next();
  } catch (ex) {
    res.status(406).send();
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
};
