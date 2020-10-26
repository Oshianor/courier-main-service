const Joi = require("joi");
const Company = require("../../models/company");
const Rider = require("../../models/rider");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/msg");
const { Storage } = require("../../utils");

/**
 * Create Rider
 * @param {*} req
 * @param {*} res
 */
exports.create = async (req, res) => {
  try {
    const riderSchema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().optional(),
      phoneNumber: Joi.string().required(),
      address: Joi.string().required(),
      DOB: Joi.date().required(),
      proofOfIdentityExpireAt: Joi.date().optional(),
      policyNumber: Joi.string().optional(),
      plateNumber: Joi.string().optional(),
      ecName: Joi.string().optional(),
      ecPhone: Joi.string().optional(),
      ecEmail: Joi.string().email().optional(),
    });

    const { error } = riderSchema.validate(req.body);

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
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const data = req.body;
    data.company = company._id;

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

    const rider = await Rider.create(data);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get One Rider
 * @param {*} req
 * @param {*} res
 */
exports.getOne = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const riderId = req.params.riderId;
    const rider = await Rider.findOne({ _id: riderId });

    if (!rider) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, null, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Get All Riders
 * @param {*} req
 * @param {*} res
 */
exports.getAll = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const riders = await Rider.find({ company: companyId });

    JsonResponse(res, 200, null, riders, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};

/**
 * Update Rider
 * @param {*} req
 * @param {*} res
 */
exports.update = async (req, res) => {
  try {
    const riderSchema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      address: Joi.string().required(),
      DOB: Joi.date().required(),
      proofOfIdentityExpireAt: Joi.date().optional(),
      policyNumber: Joi.string().optional(),
      plateNumber: Joi.string().optional(),
      ecName: Joi.string().optional(),
      ecPhone: Joi.string().optional(),
      ecEmail: Joi.string().email().optional(),
    });

    const { error } = riderSchema.validate(req.body);

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

/**
 * Delete One Rider
 * @param {*} req
 * @param {*} res
 */
exports.destroy = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      JsonResponse(res, 404, "Company Not Found!", null, null);
      return;
    }

    const riderId = req.params.riderId;
    const rider = await Rider.findByIdAndDelete(riderId);

    if (!rider) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }
    JsonResponse(res, 200, MSG_TYPES.DELETED, rider, null);
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
