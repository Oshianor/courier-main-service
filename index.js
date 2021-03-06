require("winston-mongodb");
require("./startup/aws");
require("./startup/logger");
require("./startup/firebase");
const { http, app } = require("./startup/socket")
// require("./startup/prod")(app);
const config = require("config");
const port = process.env.PORT || config.get("application.port");
const mongoose = require('mongoose');
// require("./scripts/updateEnterpriseTransactions");
// require("./scripts/createTransactionForEachOrder")

mongoose
  .connect(config.get("database.url"), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB...");
    http.listen(port, () => console.error(`Logiistics Service listening on http://localhost:${port}`));
  })
  .catch((err) => console.error("Could not connect to MongoDB..."));