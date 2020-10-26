const Joi = require("joi");
const Company = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");
const { Storage } = require("../../utils");

/**
 * Create Company
 * @param {*} req
 * @param {*} res
 */
exports.createCompany = async (req, res) => {
  try {
    companySchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email(),
      password: Joi.string()
        .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
        .required(),
      repeat_password: Joi.ref("password"),
      contactName: Joi.string().required(),
      contactPhoneNumber: Joi.string().required(),
      RCnumber: Joi.string().optional(),
      TIN: Joi.string().optional(),
    }).with("password", "repeat_password");

    const { error } = companySchema.validate(req.body);

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    // check if an existing company  has incoming email
    const admins = await Company.find({ email: req.body.email });

    if (admins.length > 0) {
      JsonResponse(res, 400, `\"email"\ already exists!`, null, null);
      return;
    }

    const data = req.body;

    if (req.files.rcDoc) {
      data.rcDoc = await Storage.upload(
        req.files.rcDoc.data,
        req.files.rcDoc.name
      );
    }
    if (req.files.logo) {
      data.logo = await Storage.upload(
        req.files.logo.data,
        req.files.logo.name
      );
    }

    //Save Data to bb
    const company = await Company.create(data);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
