'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('language');

  // 计算当前路径对应的其他语言路径
  const getPathForLocale = useCallback((targetLocale: string) => {
    // 从当前路径中移除当前语言前缀
    const segments = pathname.split('/');
    if (segments[1] === locale) {
      segments.splice(1, 1);
    }
    
    // 始终添加语言前缀（包括中文）
    segments.splice(1, 0, targetLocale);
    
    return segments.join('/') || '/';
  }, [locale, pathname]);

  // 处理语言切换
  const handleLocaleChange = useCallback((newLocale: string) => {
    const path = getPathForLocale(newLocale);
    router.push(path);
  }, [getPathForLocale, router]);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleLocaleChange('zh')}
        className={`px-2 py-1 rounded text-sm ${locale === 'zh' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        {t('zh')}
      </button>
      <button
        onClick={() => handleLocaleChange('en')}
        className={`px-2 py-1 rounded text-sm ${locale === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        {t('en')}
      </button>
    </div>
  );
} 