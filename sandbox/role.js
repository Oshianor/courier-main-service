const { JsonResponse } = require("../lib/apiResponse");
const { MSG_TYPES } = require("../constant/msg");
const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
};

/*
 * @param array of strings
 */
const hasRole = (roles = []) => {
  return function (req, res, next) {
    if (req.admin.role === ROLES.SUPER_ADMIN) {
      next();
    } else {
      if (roles.length < 1) {
        return JsonResponse(res, 403, MSG_TYPES.PERMISSION, null, null);
      }
      for (let role of roles) {
        if (req.admin.role === role) {
          next();
        } else {
          return JsonResponse(res, 403, MSG_TYPES.PERMISSION, null, null);
        }
      }
    }
  };
};

module.exports = {
  hasRole,
  ROLES,
};
