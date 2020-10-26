const Joi = require("joi");
const Company = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");
const { Storage } = require("../../utils");

/**
 * Update One Company
 * @param {*} req
 * @param {*} res
 */
exports.updateSingle = async (req, res) => {
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
    const companyId = req.params.companyId;
    const company = await Company.findByIdAndUpdate(companyId, data, {
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
 * Update Company Status
 * @param {*} req
 * @param {*} res
 */
exports.updateStatus = async (req, res) => {
  try {
    adminSchema = Joi.object({
      status: Joi.string().required().valid("active", "inactive", "suspended"),
    }).with("password", "repeat_password");

    const { error } = adminSchema.validate(req.body);

    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }

    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    company.status = req.body.status;
    await company.save();

    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
