module.exports = {
  apps: [{
    name: "vocab",
    cwd: "./backend",
    script: "server.js",
    max_memory_restart: "150M",
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    env: {
      PORT: 3003,
      NODE_ENV: "production"
    }
  }]
};
