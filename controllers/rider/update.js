const Joi = require("joi");
const Company = require("../../models/company");
const { Rider, validateUpdateRider } = require("../../models/rider");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");
const { Storage } = require("../../utils");

/**
 * Update Rider
 * @param {*} req
 * @param {*} res
 */
exports.updateSingle = async (req, res) => {
  try {

    const { error } = validateUpdateRider(req.body);

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const data = req.body;

    if (req.files.proofOfIdentity) {
      data.proofOfIdentity = await Storage.upload(
        req.files.proofOfIdentity.data,
        req.files.proofOfIdentity.name
      );
    }

    if (req.files.image) {
      data.image = await Storage.upload(
        req.files.image.data,
        req.files.image.name
      );
    }

    const riderId = req.params.riderId;
    const rider = await Rider.findByIdAndUpdate(riderId, data, {
      new: true,
    });

    if (!rider) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.UPDATED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
