'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface OnlineStatusProps {
  userId?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function OnlineStatus({ userId, showLabel = false, size = 'md' }: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    // 检查浏览器在线状态
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="inline-flex items-center gap-1">
      <span
        className={`${sizeClasses[size]} rounded-full ${
          isOnline 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-gray-400'
        }`}
        title={isOnline ? '在線' : '離線'}
      />
      {showLabel && (
        <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
          {isOnline ? '在線' : '離線'}
        </span>
      )}
    </div>
  );
}

// 成员在线状态列表组件
interface OnlineMember {
  id: number;
  name: string;
  avatar: string;
  isOnline?: boolean;
}

interface OnlineMembersListProps {
  members: OnlineMember[];
  maxDisplay?: number;
}

export function OnlineMembersList({ members, maxDisplay = 10 }: OnlineMembersListProps) {
  const onlineCount = members.filter(m => m.isOnline).length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {members.slice(0, maxDisplay).map(member => (
          <div
            key={member.id}
            className="relative"
            title={member.name}
          >
            <img
              src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`}
              alt={member.name}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700"
            />
            {member.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full" />
            )}
          </div>
        ))}
        {members.length > maxDisplay && (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
            +{members.length - maxDisplay}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {onlineCount}人在線
      </span>
    </div>
  );
}
