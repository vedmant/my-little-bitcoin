module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    // First application
    {
      name: 'my-little-bitcoin',
      script: 'src/index.js',
      env: {
        DEMO: 'true',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/app.log',
      max_memory_restart: '50M',
    },
  ],
}
