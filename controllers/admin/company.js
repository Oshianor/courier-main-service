const Joi = require("joi");
const Company = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");

/**
 * Create Company
 * @param {*} req
 * @param {*} res
 */

exports.createCompany = async (req, res) => {
  try {
    adminSchema = Joi.object({
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

    const { error } = adminSchema.validate(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }
    // check if an existing company  has incoming email
    const admins = await Company.find({ email: req.body.email });

    if (admins.length > 0) {
      return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);
    }

    const company = await Company.create(req.body);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get One Company
 * @param {*} req
 * @param {*} res
 */
exports.getOne = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, null, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All Companies
 * @param {*} req
 * @param {*} res
 */
exports.getAll = async (req, res) => {
  try {
    const companies = await Company.find({});

    JsonResponse(res, 200, null, companies, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Update One Company
 * @param {*} req
 * @param {*} res
 */
exports.update = async (req, res) => {
  try {
    adminSchema = Joi.object({
      name: Joi.string().required(),
      contactName: Joi.string().required(),
      contactPhoneNumber: Joi.string().required(),
      RCnumber: Joi.string().optional(),
      TIN: Joi.string().optional(),
    });

    const { error } = adminSchema.validate(req.body);

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }
    const companyId = req.params.companyId;
    const company = await Company.findByIdAndUpdate(companyId, req.body, {
      new: true,
    });

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.UPDATED, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Delete One Company
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findByIdAndDelete(companyId);

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    JsonResponse(res, 200, MSG_TYPES.DELETED, company, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
