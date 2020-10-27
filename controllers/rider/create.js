const Joi = require("joi");
const { Company } = require("../../models/company");
const { Rider, validateRider } = require("../../models/rider");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");
const { Verification } = require("../../templates");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../../utils");
const moment = require("moment");
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
      const riderCheck = await Rider.findOne({ email: req.body.email });

      if (riderCheck) {
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

    const token = GenerateToken(50);
    data.rememberToken = {
      token,
      expiredDate: moment().add(2, "days"),
    };

    const rider = await Rider.create(data);

    const subject = "Welcome to Exalt Logistics";
    const html = Verification(token, req.body.email);
    Mailer(req.body.email, subject, html);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
