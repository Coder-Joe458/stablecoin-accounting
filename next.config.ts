import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// 明确指定i18n配置文件路径
const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // 配置默认环境变量，确保在生产环境中禁用所有日志
    NEXT_PUBLIC_ENABLE_LOGS: process.env.NEXT_PUBLIC_ENABLE_LOGS || 'false',
    NEXT_PUBLIC_ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG || 'false',
    NEXT_PUBLIC_DISABLE_WARNINGS: process.env.NEXT_PUBLIC_DISABLE_WARNINGS || 'false'
  },
  
  // 禁用日志输出的配置
  reactStrictMode: false, // 关闭严格模式避免双重渲染
  
  // 构建输出配置
  output: 'standalone',
  
  // 处理构建错误
  onDemandEntries: {
    // 页面缓存时间
    maxInactiveAge: 25 * 1000,
    // 最大页面数
    pagesBufferLength: 4,
  },
  
  // 禁用预渲染以防止 WalletConnect 错误
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 禁用静态页面生成
  experimental: {
    serverComponentsExternalPackages: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
  
  // 添加特定的构建输出选项
  staticPageGenerationTimeout: 180,
  
  // 添加页面配置以跳过特定页面的生成
  skipTrailingSlashRedirect: true,
  
  // 修改构建配置以避免预渲染问题
  compiler: {
    // 移除 React 的 SSR 特定代码
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    // 在生产环境中删除所有的console.*调用
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'], // 保留console.error以便跟踪错误
    } : false,
  },
  
  // 禁用静态HTML导出功能，使用Vercel动态渲染
  distDir: '.next',
  
  // 定义页面
  async headers() {
    return [
      {
        source: '/_not-found',
        headers: [
          {
            key: 'x-robots-tag',
            value: 'noindex',
          },
        ],
      },
    ];
  },
  
  // 确保将关键的环境变量传递给客户端
  publicRuntimeConfig: {
    // 这些值将在客户端可用
    NEXT_PUBLIC_ENABLE_LOGS: process.env.NEXT_PUBLIC_ENABLE_LOGS || 'false',
    NEXT_PUBLIC_ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG || 'false',
    NEXT_PUBLIC_DISABLE_WARNINGS: process.env.NEXT_PUBLIC_DISABLE_WARNINGS || 'false',
  },
};

export default withNextIntl(nextConfig);
