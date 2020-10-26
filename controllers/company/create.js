const {Company, validateCompany} = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");
const { Storage, Mailer } = require("../../utils");
const { Verification } = require("../../templates")
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");

/**
 * Create Company
 * @param {*} req
 * @param {*} res
 */
exports.createCompany = async (req, res) => {
  try {
    const { error } = validateCompany(req.body);
    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    // check if an existing company  has incoming email
    const company = await Company.findOne({ email: req.body.email });
    if (company) return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);

    if (req.files.rcDoc) {
      const rcDoc = await Storage.upload(
        req.files.rcDoc.data,
        req.files.rcDoc.name
      );
      req.body.rcDoc = rcDoc.Key;
    }
    if (req.files.logo) {
      const logo = await Storage.upload(
        req.files.logo.data,
        req.files.logo.name
      );
      req.body.logo = logo.Key;
    }

    //Save Data to bb
    const token = GenerateToken(50);
    req.body.rememberToken = { token, expiredDate: moment().add(2, "days") };
    req.body.createdBy = req.user.id;
    req.body.publicToken = uuidv4();
    const newCompany = await Company.create(req.body);

    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email);
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, newCompany, null);
    return
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
