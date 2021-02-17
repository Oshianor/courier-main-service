const { JsonResponse } = require("../lib/apiResponse");

module.exports = async(req, res, next) => {
  return JsonResponse(res, 404, "API endpoint not found");
}