module.exports = {
  apps: [
    {
      name: "whatsapppi",
      script: "app.js",

      // Node settings
      node_args: "--max-old-space-size=8192",

      // Execution mode
      exec_mode: "cluster",   // change to "cluster" if needed
      instances: 1,

      // Reliability
      autorestart: true,
      watch: false,
      max_memory_restart: "9G",

      // Environment
      env: {
        NODE_ENV: "production",
	NODE_PORT: 20112
      },

      // Logging
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
