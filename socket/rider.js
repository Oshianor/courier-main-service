const { Entry, validateLocalEntry } = require("../models/entry");
const { Company } = require("../models/company");
const { SocketResponse } = require("../lib/apiResponse");
const { Pricing } = require("../models/pricing");
const moment = require("moment");
const services = require("../services");
const { SERVER_EVENTS } = require("../constant/events");

exports.riderLocation = async (socket) => {
  if (socket.user.type !== "company")
    return SocketResponse(true, "Company Socket");

  const company = await Company.findOne({
    _id: socket.user.id,
    $or: [{ status: "active" }, { status: "inactive" }],
    verified: true,
  });
  if (!company) return SocketResponse(true, "Company Account Not Found");

  const entries = await Entry.find({
    source: "pool",
    status: "pending",
    state: company.state,
    company: null,
  }).select("-metaData");

  return SocketResponse(false, "ok", entries);
};
