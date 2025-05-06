import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from './client-layout';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "稳定币记账系统",
  description: "轻松管理您的稳定币交易记录",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
} 