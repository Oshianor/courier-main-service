const config = require('config');
const jwt = require("jsonwebtoken");
const { JsonResponse } = require("../lib/apiResponse")


// auth middleware
Auth = async (req, res, next) => {
	const token = req.header('x-auth-token');
	if (!token) return JsonResponse(res, 401, "ACCESS_DENID", null, null);

	try {
		const decoded = jwt.verify(token, config.get("application.jwt.key"));
		req.user = decoded;

		// if (!req.user.verified) return JsonResponse(res, 403, "DEACTIVATED", null, null);

		next();
	} catch (ex) {
		console.log(ex);
		if (ex.name === 'TokenExpiredError') {
			return JsonResponse(res, 403, "SESSION_EXPIRED", null, null);
		}
		res.status(406).send();
	}
};


exports.Auth = Auth;