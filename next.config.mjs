let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Set production mode explicitly
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  // Disable webpack HMR in production
  webpack: (config, { dev, isServer }) => {
    // Disable HMR in production
    if (!dev) {
      config.optimization.moduleIds = 'deterministic';
      // Completely disable HMR in production
      if (!isServer) {
        // Disable client-side HMR connection attempts
        config.plugins = config.plugins.filter(
          (plugin) => plugin.constructor.name !== 'HotModuleReplacementPlugin'
        );
      }
    }
    return config;
  },
  // Disable development-only features in production
  devIndicators: {
    buildActivity: false,
  },
  images: {
    unoptimized: false,
    domains: [
      'img.discogs.com', 
      'i.discogs.com', 
      'api.discogs.com',
      'st.discogs.com',
      's.discogs.com'
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  env: {
    // Add fallback for build process
    BUILD_DATABASE_FALLBACK: 'true'
  },
  // Add API rewrites to proxy requests to the backend
  async rewrites() {
    return [
      // Proxy API requests to backend
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`
      }
    ]
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
