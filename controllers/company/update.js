const Joi = require("joi");
const {
  Company,
  validateUpdateCompany,
  validateStatusUpdate,
} = require("../../models/company");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { UploadFileFromBinary } = require("../../utils");

/**
 * Update One Company
 * @param {*} req
 * @param {*} res
 */
exports.updateSingle = async (req, res) => {
  try {
    const { error } = validateUpdateCompany(req.body);

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    if (req.body.country) {
      const country = await Country.findOne({ name: req.body.country });
      if (!country)
        return JsonResponse(res, 404, "Country Not Found", null, null);
    }

    // validate state
    if (req.body.state) {
      const state = country.states.filter((v, i) => v.name === req.body.state);
      if (typeof state[0] === "undefined")
        return JsonResponse(res, 404, "State Not Found", null, null);
    }

    const data = req.body;

    if (req.files) {
      if (req.files.rcDoc) {
        const rcDoc = await UploadFileFromBinary(
          req.files.rcDoc.data,
          req.files.rcDoc.name
        );
        req.body.rcDoc = rcDoc.Key;
      }
      if (req.files.logo) {
        const logo = await UploadFileFromBinary(
          req.files.logo.data,
          req.files.logo.name
        );
        req.body.logo = logo.Key;
      }
    }

    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });

    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    const updatedCompany = await Company.findByIdAndUpdate(companyId, data, {
      new: true,
    });

    JsonResponse(res, 200, MSG_TYPES.UPDATED, updatedCompany, null);
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
    const { error } = validateStatusUpdate(req.body);
    if (error) {
      return JsonResponse(res, 400, error.details[0].message, null, null);
    }
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    const account = await Company.findOneAndUpdate(
      { _id: companyId },
      req.body
    );
    JsonResponse(res, 200, MSG_TYPES.UPDATED, null, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
