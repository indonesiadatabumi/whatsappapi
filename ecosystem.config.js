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
        PORT: 20112,
        // WAHA (WhatsApp HTTP API) Configuration
        WAHA_BASE_URL: "http://41.216.186.50:30401",
        WAHA_API_KEY: "318d6cd072944f0baaec16741e8b2b44",
        WAHA_SESSION: "default"
      },

      // Logging
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
