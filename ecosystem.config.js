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

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {
    production: {
      user: 'node',
      host: '212.83.163.1',
      ref: 'origin/master',
      repo: 'git@github.com:vedmant/my-little-bitcoin.git',
      path: '/home/my-little-bitcoin/project',
      'post-deploy': 'yarn && npm run prod && pm2 reload ecosystem.config.js --env production',
    },
  },
}
