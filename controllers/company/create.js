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
    const company = await Company.findOne({ email: req.body.email });
    if (company) return JsonResponse(res, 400, `\"email"\ already exists!`, null, null);

    const data = req.body;

    if (req.files.rcDoc) {
      const rcDoc = await Storage.upload(
        req.files.rcDoc.data,
        req.files.rcDoc.name
      );
      data.rcDoc = rcDoc.Key;
    }
    if (req.files.logo) {
      const logo = await Storage.upload(
        req.files.logo.data,
        req.files.logo.name
      );
      data.logo = logo.Key;
    }
    data.createdBy = req.user.id;

    //Save Data to bb
    const newCompany = await Company.create(data);

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, newCompany, null);
    return
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};
