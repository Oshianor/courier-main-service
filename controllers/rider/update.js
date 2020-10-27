const Joi = require("joi");
const { Company } = require("../../models/company");
const { Account } = require("../../models/account");
const { Rider, validateUpdateRider } = require("../../models/rider");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { UploadFileFromBinary } = require("../../utils");

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

    const company = await Company.findOne({ account: req.user.id });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const data = req.body;

    if (req.files.proofOfIdentity) {
      const proofOfIdentity = await UploadFileFromBinary(
        req.files.proofOfIdentity.data,
        req.files.proofOfIdentity.name
      );
      data.proofOfIdentity = proofOfIdentity.Key;
    }

    if (req.files.image) {
      const image = await UploadFileFromBinary(
        req.files.image.data,
        req.files.image.name
      );
      data.image = image.Key;
    }

    const riderId = req.params.riderId;
    const rider = await Rider.findByIdAndUpdate(riderId, data, {
      new: true,
    });

    if (!rider) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    const account = await Account.findOneAndUpdate(
      { _id: rider.account._id },
      req.body
    );

    JsonResponse(res, 200, MSG_TYPES.UPDATED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
