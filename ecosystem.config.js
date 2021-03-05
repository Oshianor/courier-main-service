const instance_var = "PM2_APP_INSTANCE_ID"
const { name } = require("./package.json");
const log_date_format = "YYYY-MM-DD HH:mm Z";

module.exports = {
  apps: [
    {
      namespace: name,
      name: `${name}`,
      script: "index.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      // watch: ".",
      // instances: 0,
      exec_mode: "fork",
      watch: false,
      autorestart: false,
      // watch_delay: 3000,
      // ignore_watch: ["node_modules", "public", "logs", ".git"],
      // watch_options: {
      //   followSymlinks: false,
      // },
      instance_var,
      log_date_format,
    },
    // {
    //   namespace: name,
    //   name: "Orders Management",
    //   script: "./crons/entryManagement.js",
    //   instances: 1,
    //   exec_mode: "fork",
    //   cron_restart: "*/30 * * * *",
    //   watch: false,
    //   autorestart: false,
    //   instance_var: "PM2_APP_INSTANCE_ID_CRON",
    //   log_date_format,
    // },
    // {
    //   namespace: name,
    //   name: "Subscription Management",
    //   script: "./crons/subscriptionManagement.js",
    //   instances: 1,
    //   exec_mode: "fork",
    //   cron_restart: "0 0 * * *",
    //   watch: false,
    //   autorestart: false,
    //   instance_var: "PM2_APP_INSTANCE_ID_CRON",
    //   log_date_format,
    // },
  ],
};