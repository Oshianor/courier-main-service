const instance_var = "PM2_APP_INSTANCE_ID"

module.exports = {
  apps: [
    {
      name: "exalt-logistics",
      script: "index.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      watch: ".",
      instances: 0,
      exec_mode: "cluster",
      watch_delay: 3000,
      ignore_watch: ["node_modules", "public"],
      watch_options: {
        followSymlinks: false,
      },
      instance_var,
    },
  ],
};


// cron_restart: "0 0 * * *",
