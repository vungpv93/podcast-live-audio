module.exports = {
  apps: [
    {
      name: 'live-app',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
