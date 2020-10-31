const Joi = require("joi");
const {
  Admin,
  validateAdmin,
} = require("../../models/admin");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES, ACCOUNT_TYPES } = require("../../constant/types");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../../utils");
const { Verification } = require("../../templates");
const { Country } = require("../../models/countries");
const moment = require("moment");

/**
 * Create Admin
 * @param {*} req
 * @param {*} res
 */
exports.createAdmin = async (req, res) => {
  try {
    const { error } = validateAdmin(req.body);
    if (error)
      return JsonResponse(res, 400, error.details[0].message, null, null);

    // check if an existing admin has incoming email
    const adminCheck = await Admin.findOne({ $or: [{ email: req.body.email}, { phoneNumber: req.body.phoneNumber }] });
    if (adminCheck) {
      JsonResponse(res, 400, `\"email or phoneNumber "\ already exists!`, null, null);
      return;
    }

    // validate country
    const country = await Country.findOne({ name: req.body.country });
    if (!country)
      return JsonResponse(res, 404, "Country Not Found", null, null);

      // validate state
    const state = country.states.filter((v, i) => v.name === req.body.state);
    if (typeof state[0] === "undefined") return JsonResponse(res, 404, "State Not Found", null, null);


    const token = GenerateToken(225);
    req.body.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };
    req.body.countryCode = country.cc;
    req.body.createdBy = req.user.id;
    await Admin.create(req.body);

    const subject = "Welcome to Exalt Logistics Admin";
    const html = Verification(token, req.body.email, "admin");
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong!");
  }
};
