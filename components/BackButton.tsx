'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string; // 如果指定href，则使用Link跳转
  fallbackHref?: string; // 默认返回的页面
  onClick?: () => void; // 自定义点击处理
  className?: string;
  label?: string;
}

export default function BackButton({ 
  href, 
  fallbackHref = '/dashboard', 
  onClick,
  className = '',
  label = '返回'
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      // href 由 Link 组件处理
    } else {
      // 尝试返回上一页，否则跳转到默认页面
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackHref);
      }
    }
  };

  if (href) {
    return (
      <Link 
        href={href}
        className={`inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors ${className}`}
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        <span className="font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors ${className}`}
    >
      <ArrowLeft className="w-5 h-5 mr-1" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
