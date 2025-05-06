'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "稳定币记账系统",
  description: "轻松管理您的稳定币交易记录",
};

// 动态导入 Providers 组件，禁用 SSR
const Providers = dynamic(
  () => import('./providers').then(mod => mod.Providers),
  { ssr: false }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 使用客户端状态确保钱包组件仅在客户端渲染
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <html lang="zh">
      <body className={inter.className}>
        {isMounted ? (
          <Providers>
            {children}
          </Providers>
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        )}
      </body>
    </html>
  );
}
