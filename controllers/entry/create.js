const { Company, validateCompany } = require("../../models/company");
const { Entry, validateEntry } = require("../../models/entry");
const { Order } = require("../../models/order");
const { Item } = require("../../models/item");
const { Country } = require("../../models/countries");
const { JsonResponse } = require("../../lib/apiResponse");
const { MSG_TYPES } = require("../../constant/types");
const { UploadFileFromBinary, Mailer, GenerateToken } = require("../../utils");
const { Verification } = require("../../templates");
const moment = require("moment");
const nanoid = require("nanoid");

/**
 * Create an Entry
 * @param {*} req
 * @param {*} res
*/
exports.entry = async (req, res) => {
  try {
    const { error } = validateEntry(req.body);
    if (error) return JsonResponse(res, 400, error.details[0].message, null, null);

    

    JsonResponse(res, 201, MSG_TYPES.ACCOUNT_CREATED, null, null);
    return;
  } catch (error) {
    console.log(error);
    return JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
  }
};