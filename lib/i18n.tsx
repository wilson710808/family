'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface I18nContextType {
  lang: 'zh-TW' | 'zh-CN';
  setLang: (lang: 'zh-TW' | 'zh-CN') => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<string, string>> = {
  'zh-TW': {
    home: '首頁',
    family: '家族',
    family_center: '家族中心',
    announcements: '公告',
    messages: '留言',
    chat: '聊天',
    search: '搜索',
    login: '登入',
    logout: '登出',
    register: '註冊',
    profile: '個人資料',
    system_admin: '系統管理',
    welcome_back: '歡迎回來',
    growth_column_short: '專欄',
    settings: '設置',
    members: '成員',
    gallery: '相冊',
    calendar: '日曆',
    butler: '管家',
    stats: '統計',
    documents: '文檔',
    album: '相冊',
    birthday: '生日',
    tree: '族譜',
    stock: '股票',
    growth_social: '成長社交',
    // 新增翻譯
    large_text_mode: '大字模式',
    normal_text_mode: '普通模式',
    interests: '興趣愛好',
    online: '在線',
    offline: '離線',
    back: '返回',
  },
  'zh-CN': {
    home: '首页',
    family: '家族',
    family_center: '家族中心',
    announcements: '公告',
    messages: '留言',
    chat: '聊天',
    search: '搜索',
    login: '登录',
    logout: '退出',
    register: '注册',
    profile: '个人资料',
    system_admin: '系统管理',
    welcome_back: '欢迎回来',
    growth_column_short: '专栏',
    settings: '设置',
    members: '成员',
    gallery: '相册',
    calendar: '日历',
    butler: '管家',
    stats: '统计',
    documents: '文档',
    album: '相册',
    birthday: '生日',
    tree: '族谱',
    stock: '股票',
    growth_social: '成长社交',
    // 新增翻译
    large_text_mode: '大字模式',
    normal_text_mode: '普通模式',
    interests: '兴趣爱好',
    online: '在线',
    offline: '离线',
    back: '返回',
  },
};

const I18nContext = createContext<I18nContextType>({
  lang: 'zh-TW',
  setLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang: 'zh-TW' | 'zh-CN' }) {
  const [lang, setLangState] = useState<'zh-TW' | 'zh-CN'>(initialLang);

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'zh-CN' || savedLang === 'zh-TW') {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: 'zh-TW' | 'zh-CN') => {
    setLangState(newLang);
    localStorage.setItem('language', newLang);
    document.cookie = `language=${newLang};path=/;max-age=31536000`;
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['zh-TW'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function getTranslation(lang: 'zh-TW' | 'zh-CN', key: string): string {
  return translations[lang]?.[key] || translations['zh-TW'][key] || key;
}
