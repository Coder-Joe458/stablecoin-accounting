'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";

// 动态导入 Providers 组件，禁用 SSR
const Providers = dynamic(
  () => import('./providers').then(mod => mod.Providers),
  { ssr: false }
);

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 使用客户端状态确保钱包组件仅在客户端渲染
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {isMounted ? (
        <Providers>
          {children}
        </Providers>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      )}
    </>
  );
} 