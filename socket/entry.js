const { Entry, validateLocalEntry } = require("../models/entry");
const { Company } = require("../models/company");
const { SocketResponse } = require("../lib/apiResponse");
const { Pricing } = require("../models/pricing")
const moment = require("moment");
const services = require("../services");
const { SERVER_EVENTS } = require("../constant/events");

exports.pool = async (socket) => {
  if (socket.user.type !== "company") return SocketResponse(true, "Company Socket");

  const company = await Company.findOne({ _id: socket.user.id, $or: [{ status: "active" }, { status: "inactive" }], verified: true });
  if (!company) return SocketResponse(true, "Company Account Not Found")

  const pricing = await Pricing.findOne({ _id: company.tier });
  if (!pricing) return SocketResponse(true, "Pricing Not Found")

  socket.join(String(pricing.priority));

  // console.log("pricing", pricing);
  
  const currentDate = new Date();
  let timing;
  if (pricing.priority === 0) {
    timing = moment().subtract(30, "minute");
  }else if (pricing.priority === 1) {
    timing = moment().subtract(5, "minute");
  }else if (pricing.priority === 2) {
    timing = currentDate;
  }

  console.log("timing", timing);
  console.log("currentDate", currentDate);
  const entries = await Entry.find({
    source: "pool",
    status: "pending",
    state: company.state,
    company: null,
    createdAt: {
      $lte: timing
    }
  })
    .select("-metaData");

  return SocketResponse(false, "ok", entries);
};

