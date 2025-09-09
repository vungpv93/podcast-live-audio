module.exports = {
  apps: [
    {
      name: 'live-app',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
