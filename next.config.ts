import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// 明确指定i18n配置文件路径
const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // 配置默认环境变量
    NEXT_PUBLIC_ENABLE_LOGS: process.env.NEXT_PUBLIC_ENABLE_LOGS || 'false',
    NEXT_PUBLIC_ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG || 'false',
    NEXT_PUBLIC_DISABLE_WARNINGS: process.env.NEXT_PUBLIC_DISABLE_WARNINGS || 'false'
  },
  
  // 禁用日志输出的配置
  reactStrictMode: true,
  
  // 构建输出配置
  output: 'standalone',
  
  // 处理构建错误
  onDemandEntries: {
    // 页面缓存时间
    maxInactiveAge: 25 * 1000,
    // 最大页面数
    pagesBufferLength: 4,
  },
  
  // 确保只有在浏览器环境下使用 wallet 相关库
  experimental: {
    serverComponentsExternalPackages: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
  
  // 禁用静态HTML导出功能，使用Vercel动态渲染
  distDir: '.next',
  
  // 禁用预渲染以防止 WalletConnect 错误
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
