/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 忽略 eslint 检查
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TypeScript 检查
  },
  experimental: {
    missingSuspenseWithCSRBailout: false, // 忽略 useSearchParams Suspense 警告
  },
  // 图片配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 允许所有HTTPS域名
      },
      {
        protocol: 'http',
        hostname: '**', // 允许所有HTTP域名
      },
    ],
    unoptimized: true, // 禁用图片优化，避免某些外部图片加载问题
  },
  // 添加重写规则来代理图片请求
  async rewrites() {
    return [
      {
        source: '/api/proxy-image/:path*',
        destination: '/api/proxy-image/:path*',
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.globalObject = 'self';
    }
    return config;
  },
};

export default nextConfig;
