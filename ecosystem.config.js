module.exports = {
  apps: [
    {
      name: 'plastik',
      script: 'npm',
      args: 'start',
      cwd: '/data03/virt136643/domeenid/www.komeh.tech/plastik/rekords', // Replace with your actual project path
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      instances: 1,
      autorestart: true,
    },
  ],
};