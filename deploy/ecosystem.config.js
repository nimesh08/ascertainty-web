// pm2 ecosystem file for exira-web
//
// Usage:
//   cp deploy/ecosystem.config.js .
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup     # follow printed instructions to enable start-on-boot
//
// Assumes the repo is cloned at /home/ubuntu/exira-web and that
// `npm run build` has been run at least once. Port 3100 matches the
// reverse_proxy target in deploy/Caddyfile.example.

module.exports = {
  apps: [
    {
      name: "exira-web-v2",
      cwd: "/home/ubuntu/exira-web",
      script: "npm",
      args: "run start -- --port 3100",
      autorestart: true,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
      },
      out_file: "/home/ubuntu/.pm2/logs/exira-web-v2-out.log",
      error_file: "/home/ubuntu/.pm2/logs/exira-web-v2-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
