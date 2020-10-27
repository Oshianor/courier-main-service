const Joi = require("joi");
const { Company } = require("../../models/company");
const { Rider, validateRider } = require("../../models/rider");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../../utils");

/**
 * Create Rider
 * @param {*} req
 * @param {*} res
 */
exports.create = async (req, res) => {
  try {
    const { error } = validateRider(req.body);

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    if (req.body.email) {
      // check if an existing rider has incoming email
      const admins = await Rider.find({ email: req.body.email });

      if (admins.length > 0) {
        JsonResponse(res, 400, `\"email"\ already exists!`, null, null);
        return;
      }
    }
    const company = await Company.findOne({ _id: req.user.id });

    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const data = req.body;
    data.company = company._id;

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

    const rider = await Rider.create(data);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
