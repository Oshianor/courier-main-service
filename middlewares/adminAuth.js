const JWT = require("jsonwebtoken");
const Admin = require("../models/admin");
const config = require("config");
const { JsonResponse } = require("../lib/apiResponse");

exports.adminAuth = async (req, res, next) => {
  try {
    //get token from header: Bearer <token>
    const token = req.headers.authorization.split(" ")[1];
    //verify this token was signed by your server
    const decodedToken = JWT.verify(token, config.get("application.jwt.key"));
    ///Get admin details
    let admin = await Admin.findById(decodedToken.id);
    if (!admin) throw Error("Unauthenticated");
    //put admin in req object; so the controller can access current admin
    req.admin = admin;
    next();
  } catch {
    return JsonResponse(res, 401, "Unauthenticated", null, null);
  }
};
