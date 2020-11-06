const config = require("config");
const port = process.env.PORT || config.get("application.port");
require("winston-mongodb");
require("./startup/aws");
require("./startup/logger");
require("./startup/db");
require("./startup/routes");

const { http } = require("./startup/socket");

http.listen(port, () => console.error(`listening on http://localhost:${port}`));
