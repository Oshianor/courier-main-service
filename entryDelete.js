const mongoose = require("mongoose");
const config = require("config");
const moment = require("moment");
const Entry = require("./models/entry");
const Order = require("./models/order");
const { AsyncForEach } = require("./utils");


mongoose
  .connect(config.get("database.url"), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB...");
    handleEntryDelete();
  })
  .catch((err) => console.error("Could not connect to MongoDB..."));

/**
 * Check for post that have been accepted and not passed to riders
 * removed from their list and back into the pool.
 */
handleEntryDelete = async () => {
  try {
    const tenMins = moment().add(24, "hours");

    console.log("tenMins", tenMins);

    const entry = await Entry.find({
      status: "request",
      createdAt: { $lte: tenMins },
    }).lean();

    console.log("entry", entry);

    await AsyncForEach(entry, async (data, index) => {
      await Entry.deleteOne({ _id: data._id, status: "request" });
      await Order.deleteMany({ entry: data._id, status: "request" });
    });

  } catch (error) {
    console.log("error", error);
  }
}