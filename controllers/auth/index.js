const { User, validateLogin } = require("../../models/users");
const config = require("config");
const { JsonResponse } = require("../../lib/apiResponse");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


LoginAsUser = async (req, res) => {
  try {
		const { error } = validateLogin(req.body);
		if(error) return JsonResponse(res, 400, error.details[0].message, null, null);

		// find the user trying to login
    const user = await User.findOne({ email: req.body.email.toLowerCase(), verified: true });
		if (!user) return JsonResponse(res, 400, "ACCOUNT_INVALID", null, null);


		// compare request password with the password saved on the database
    let validPassword = await bcrypt.compare(req.body.password, user.password);
		if (!validPassword) return JsonResponse(res, 400, "ACCOUNT_INVALID", null, null);

    let token = user.generateToken();

    res.header("x-auth-token", token);
    JsonResponse(res, null, "LOGGED_IN", null, null);
    return 
	} catch (error) {
		console.log(error);
		return res.status(500).send("Something went wrong!");
	}
};

module.exports = {
    LoginAsUser,
};
