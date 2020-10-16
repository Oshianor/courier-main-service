const winston = require("winston");
const path = require("path");
const config = require("config");

// Set this to whatever, by default the path of the script.
const logPath = __dirname;

const tsFormat = () => new Date().toISOString();

const errorLog = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(logPath, "../logs/errors.log"),
      timestamp: tsFormat,
      level: "info"
    })
  ]
});

const accessLog = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(logPath, "../logs/access.log"),
      timestamp: tsFormat,
      level: "info"
    })
  ]
});

process.on('uncaughtException', (ex) => {
  errorLog.info(ex.message);
  console.log(ex);
  process.exit(1);
});

process.on('unhandledRejection', (ex) => {
  accessLog.info(ex.message);
  console.log(ex);
  // process.exit(1);
});

// json web token code
if (!config.get("application.port")) {
  console.error("FATAL ERROR: Application port is not defined.");
  process.exit(1);
}

module.exports = { errorLog, accessLog };
