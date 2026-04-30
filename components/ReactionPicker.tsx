'use client';

import { useState, useRef, useEffect } from 'react';

const EMOJI_LIST = ['👍', '❤️', '😊', '🎉', '🔥', '💯', '👏', '🙌'];

interface Reaction {
  emoji: string;
  count: number;
  users: number[];
}

interface ReactionPickerProps {
  messageId: number;
  reactions: Reaction[];
  currentUserId: number;
  onReactionChange?: (reactions: Reaction[]) => void;
}

export default function ReactionPicker({ 
  messageId, 
  reactions, 
  currentUserId,
  onReactionChange 
}: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState<Reaction[]>(reactions);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭 picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReaction = async (emoji: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      const data = await res.json();

      if (data.success) {
        // 更新本地状态
        setLocalReactions(prev => {
          const existing = prev.find(r => r.emoji === emoji);
          if (data.action === 'removed') {
            // 移除
            if (existing && existing.count <= 1) {
              return prev.filter(r => r.emoji !== emoji);
            }
            return prev.map(r => 
              r.emoji === emoji 
                ? { ...r, count: r.count - 1, users: r.users.filter(id => id !== currentUserId) }
                : r
            );
          } else {
            // 添加
            if (existing) {
              return prev.map(r =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, users: [...r.users, currentUserId] }
                  : r
              );
            }
            return [...prev, { emoji, count: 1, users: [currentUserId] }];
          }
        });
        
        onReactionChange?.(localReactions);
      }
    } catch (error) {
      console.error('表情回应失败:', error);
    }
    setShowPicker(false);
  };

  const hasReacted = (emoji: string) => {
    return localReactions.find(r => r.emoji === emoji)?.users.includes(currentUserId) || false;
  };

  return (
    <div className="relative inline-block" ref={pickerRef}>
      {/* 显示已有表情回应 */}
      {localReactions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {localReactions.map(reaction => (
            <button
              key={reaction.emoji}
              onClick={() => handleReaction(reaction.emoji)}
              className={`reaction-badge ${hasReacted(reaction.emoji) ? 'active' : ''}`}
            >
              <span>{reaction.emoji}</span>
              <span className="ml-1 text-xs">{reaction.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* 添加反应按钮 */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600"
      >
        <span className="text-lg">+</span>
      </button>

      {/* 表情选择器 */}
      {showPicker && (
        <div className="reaction-popup absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="flex gap-1">
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-110 ${
                  hasReacted(emoji) ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <span className="text-2xl">{emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
