'use client';

import { ReactNode, useEffect, useState } from 'react';
import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 从环境变量获取项目ID，如果不存在则使用默认值
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo_project_id';

const config = getDefaultConfig({
  appName: 'Stablecoin Accounting System',
  projectId, // 使用环境变量
  chains: [mainnet, polygon, base],
  ssr: false,
});

// 创建QueryClient实例
const queryClient = new QueryClient();

export default function ClientEntry({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          appInfo={{
            appName: 'Stablecoin Accounting System',
            learnMoreUrl: 'https://example.com/about',
          }}
          showRecentTransactions={true}
          theme={lightTheme({
            accentColor: '#4f46e5', // indigo-600
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 