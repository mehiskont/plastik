module.exports = {
  apps: [
    {
      name: 'plastik',
      script: 'npm',
      args: 'start',
      cwd: '/data02/virt136781/domeenid/www.plastikrecords.ee/rekords', // Updated with current project path
      env: {
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1', // Disable telemetry
        NEXT_PUBLIC_ENVIRONMENT: 'production',
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
    },
  ],
};