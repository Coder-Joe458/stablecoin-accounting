import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

// 添加语言检测函数
function getLocaleFromRequest(request: NextRequest) {
  // 获取浏览器的Accept-Language头
  const acceptLanguage = request.headers.get('accept-language') || '';
  
  // 检查浏览器语言偏好
  const browserLocales = acceptLanguage.split(',')
    .map(lang => lang.split(';')[0].trim().toLowerCase())
    .filter(Boolean);
  
  console.log('检测到浏览器语言:', browserLocales);
  
  // 判断是否优先使用中文
  const prefersChinese = browserLocales.some(locale => 
    locale === 'zh' || 
    locale.startsWith('zh-') || 
    locale === 'zh-cn' || 
    locale === 'zh-hans'
  );
  
  // 如果浏览器偏好是中文，返回中文，否则英文
  return prefersChinese ? 'zh' : 'en';
}

// 创建i18n中间件
export default createMiddleware({
  // 支持的语言列表
  locales: ['en', 'zh'],
  
  // 默认语言
  defaultLocale: 'zh',
  
  // 本地化路径，保留URL路径中的语言标识
  localePrefix: 'as-needed',
  
  // 是否启用语言检测
  localeDetection: true
});

export const config = {
  // 匹配需要中间件处理的路径
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}; 