const mongoose = require("mongoose");
const config = require("config");
const moment = require("moment");
const Entry = require("../models/entry");
const { AsyncForEach } = require("../utils");
const CompanySubscription = require("../subscription/company");


mongoose
  .connect(config.get("database.url"), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB...");
    handleEntryManagement();
  })
  .catch((err) => console.error("Could not connect to MongoDB..."));

/**
 * Check for post that have been accepted and not passed to riders 
 * removed from their list and back into the pool.
 */
handleEntryManagement = async () => {
  try {
    const tenMins = moment().add(10, "minutes");

    const entry = await Entry.find({
      entryprise: null,
      status: "companyAccepted",
      companyAcceptedAt: { $lt: tenMins },
    });

    console.log("entry", entry);

    await AsyncForEach(entry, async (arr, index) => {
      const companySub = new CompanySubscription();
      await companySub.dispatchToStateRoom(arr);
    });

    await Entry.updateMany(
      {
        entryprise: null,
        status: "companyAccepted",
        companyAcceptedAt: { $lt: tenMins },
      },
      {
        status: "pending",
        companyAcceptedAt: null,
      }
    );
  } catch (error) {
    console.log("error", error);
  }
}