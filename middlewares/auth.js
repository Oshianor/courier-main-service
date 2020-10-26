const jwt = require("jsonwebtoken");
const { JsonResponse } = require("../lib/apiResponse")
const config = require("config");
const { MSG_TYPES } = require("../constant/msg");
const { Admin } = require("../models/admin")
const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
};

/*
 * @param array of strings
 */
const hasRole = (roles = []) => {
  return async (req, res, next) => {
    let admin = await Admin.findOne({ _id: req.user.id, status: "active" });
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
	const token = req.header('x-auth-token');
	if (!token) return JsonResponse(res, 401, "ACCESS_DENID", null, null);

	try {
		const decoded = jwt.verify(token, config.get("application.jwt.key"));
		req.user = decoded;

		next();
	} catch (ex) {
		console.log(ex);
		if (ex.name === 'TokenExpiredError') {
			return JsonResponse(res, 403, "SESSION_EXPIRED", null, null);
		}
		res.status(406).send();
	}
};


module.exports = {
  Auth,
  hasRole,
  ROLES,
};