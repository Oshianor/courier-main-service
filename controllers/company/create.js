const {Company, validateCompany} = require("../../models/company");
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
    const { error } = validateCompany(req.body);

    if (error) {
      JsonResponse(res, 400, error.details[0].message, null, null);
      return;
    }

    // check if an existing company  has incoming email
    const admins = await Company.findOne({ email: req.body.email });
    if (admins) return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);


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
    return
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
