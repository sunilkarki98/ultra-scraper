// FILE: pm2.config.js
export const apps = [
    {
        name: "ultra-scraper", // Name in the PM2 list
        script: "./dist/index.js", // The entry point (compiled JS)
        instances: 1, // Number of processes to run
        exec_mode: "fork", // 'fork' or 'cluster'
        max_memory_restart: "1G", // Restart if it uses > 1GB RAM


        // Environment Variables
        env: {
            NODE_ENV: "production",
            PORT: 3000,
            HEADLESS: true
        },

        // Logging
        log_date_format: "YYYY-MM-DD HH:mm Z",
        error_file: "./logs/error.log",
        out_file: "./logs/output.log",
    }
];