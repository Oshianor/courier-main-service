const { JsonResponse } = require("../../lib/apiResponse");
const { Entry, validateLocalEntry } = require("../../models/entry");
const { Company } = require("../../models/company");
const { Order } = require("../../models/order");
const { MSG_TYPES } = require("../../constant/types");
const { paginate } = require("../../utils");

exports.byCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.user.id,
    });
    if (!company)
      return JsonResponse(res, 404, "Company Not Found!", null, null);

    //get pagination value
    const { page, pageSize, skip } = paginate(req);

    const entries = await Entry.find({
      source: "pool",
      state: company.state,
    })
      .skip(skip)
      .limit(pageSize)
      .select("-metaData");

    const total = await Entry.find({
      source: "pool",
      state: company.state,
    }).countDocuments();

    const meta = {
      total,
      pagination: { pageSize, page },
    };
    JsonResponse(res, 200, MSG_TYPES.FETCHED, entries, meta);
    return;
  } catch (error) {
    console.log(error);
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};

exports.singleEntry = async (req, res) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id })
      .populate("orders")
      .select("-metaData");

    if (!entry) {
      JsonResponse(res, 404, MSG_TYPES.NOT_FOUND, null, null);
      return;
    }

    JsonResponse(res, 200, MSG_TYPES.FETCHED, entry, null);
    return;
  } catch (error) {
    JsonResponse(res, 500, MSG_TYPES.SERVER_ERROR, null, null);
    return;
  }
};
