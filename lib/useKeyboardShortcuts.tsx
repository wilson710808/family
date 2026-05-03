'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 忽略輸入框中的快捷鍵
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // 允許 ESC 鍵
      if (event.key !== 'Escape') return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }

    // 顯示/隱藏幫助面板
    if (event.key === '?' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      setShowHelp(prev => !prev);
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { showHelp, setShowHelp };
}

// 默認快捷鍵配置
export function getDefaultShortcuts(router: ReturnType<typeof useRouter>): KeyboardShortcut[] {
  return [
    // 導航
    {
      key: 'h',
      ctrl: true,
      action: () => router.push('/dashboard'),
      description: '首頁',
      category: '導航',
    },
    {
      key: 'f',
      ctrl: true,
      action: () => router.push('/families'),
      description: '家族',
      category: '導航',
    },
    {
      key: 's',
      ctrl: true,
      action: () => router.push('/search'),
      description: '搜索',
      category: '導航',
    },
    {
      key: 'c',
      ctrl: true,
      action: () => router.push('/chat'),
      description: '聊天',
      category: '導航',
    },
    {
      key: 'm',
      ctrl: true,
      action: () => router.push('/messages'),
      description: '留言板',
      category: '導航',
    },
    {
      key: 'a',
      ctrl: true,
      action: () => router.push('/announcements'),
      description: '公告',
      category: '導航',
    },
    
    // 通用
    {
      key: 'Escape',
      action: () => {
        // 關閉模態框等
        document.dispatchEvent(new CustomEvent('keyboard-escape'));
      },
      description: '關閉/取消',
      category: '通用',
    },
    {
      key: '/',
      action: () => {
        router.push('/search');
      },
      description: '聚焦搜索',
      category: '通用',
    },
  ];
}

// 快捷鍵幫助面板
export function KeyboardShortcutsHelp({ shortcuts, onClose }: { shortcuts: KeyboardShortcut[]; onClose: () => void }) {
  // 按類別分組
  const categories = [...new Set(shortcuts.map(s => s.category))];
  
  const getShortcutDisplay = (shortcut: KeyboardShortcut) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('⌘');
    if (shortcut.shift) parts.push('⇧');
    if (shortcut.alt) parts.push('⌥');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' ');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">鍵盤快捷鍵</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {categories.map(category => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-mono text-sm border border-gray-200 shadow-sm">
                        {getShortcutDisplay(shortcut)}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            按 <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">?</kbd> 查看幫助
          </p>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
}
