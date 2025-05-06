import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Providers } from "../providers";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import LanguageSwitcher from "../components/LanguageSwitcher";

const inter = Inter({ subsets: ["latin"] });

// 定义支持的语言
const locales = ['en', 'zh'];
const defaultLocale = 'en';

// 使用类型定义帮助函数，确保参数类型正确
type GenerateMetadataProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: GenerateMetadataProps): Promise<Metadata> {
  // 正确地等待 params 对象
  const params = await props.params;
  
  // 现在可以安全地访问 locale 属性
  const localeParam = String(params.locale || defaultLocale);
  const locale = locales.includes(localeParam) ? localeParam : defaultLocale;
  
  // 使用安全处理后的 locale 值
  const t = await getTranslations({ locale, namespace: 'app' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

type RootLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout(props: RootLayoutProps) {
  // 正确地等待 params 对象
  const params = await props.params;
  
  // 现在可以安全地访问 locale 属性
  const localeParam = String(params.locale || defaultLocale);
  const locale = locales.includes(localeParam) ? localeParam : defaultLocale;
  
  try {
    // 使用安全处理后的 locale 值获取消息
    const messages = await getMessages({ locale });
    
    return (
      <html lang={locale} data-theme="light">
        <body className={`${inter.className} bg-white text-gray-900`}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers>
              <div className="flex justify-end p-4 bg-white border-b border-gray-200">
                <LanguageSwitcher />
              </div>
              {props.children}
            </Providers>
          </NextIntlClientProvider>
        </body>
      </html>
    );
  } catch (error) {
    console.error('Error in RootLayout:', error);
    
    // 出错时使用默认值
    const fallbackMessages = await getMessages({ locale: defaultLocale });
    
    return (
      <html lang={defaultLocale} data-theme="light">
        <body className={`${inter.className} bg-white text-gray-900`}>
          <NextIntlClientProvider locale={defaultLocale} messages={fallbackMessages}>
            <Providers>
              <div className="flex justify-end p-4 bg-white border-b border-gray-200">
                <LanguageSwitcher />
              </div>
              {props.children}
            </Providers>
          </NextIntlClientProvider>
        </body>
      </html>
    );
  }
} 