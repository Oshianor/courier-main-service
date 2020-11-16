const winston = require('winston');
const { JsonResponse } = require('../lib/apiResponse');


module.exports = function (err, req, res, next) {
  winston.error(err.message, err);
  console.log("err ==> ", new Date().getUTCDate(), "<===>", err);
  
  return JsonResponse(res, 500, "Something went wrong!.");
}