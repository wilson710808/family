'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';

interface InterestTagsProps {
  userId: number;
  editable?: boolean;
  className?: string;
}

// 预设兴趣标签
const PRESET_INTERESTS = [
  '閱讀', '旅行', '烹飪', '運動', '音樂', '電影', '攝影', '繪畫',
  '寫作', '園藝', '寵物', '登山', '游泳', '健身', '瑜伽', '圍棋',
  '象棋', '撲克', '麻將', '唱歌', '跳舞', '戲劇', '園藝', '手工',
  '科技', '遊戲', '收藏', '品酒', '咖啡', '茶道', '投資', '理財',
  '育兒', '教育', '志願者', '環保', '歷史', '科學', '哲學', '心理學'
];

export default function InterestTags({ userId, editable = false, className = '' }: InterestTagsProps) {
  const [interests, setInterests] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterests();
  }, [userId]);

  const fetchInterests = async () => {
    try {
      const res = await fetch('/api/users/interests');
      const data = await res.json();
      if (data.success) {
        setInterests(data.interests);
      }
    } catch (error) {
      console.error('获取兴趣标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/users/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests })
      });
      const data = await res.json();
      if (data.success) {
        setInterests(data.interests);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('保存兴趣标签失败:', error);
    }
  };

  const handleAddInterest = (interest: string) => {
    if (interest && !interests.includes(interest) && interests.length < 20) {
      setInterests([...interests, interest]);
    }
    setNewTag('');
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  if (loading) {
    return <div className={className}>載入中...</div>;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          興趣愛好
        </span>
        {editable && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            編輯
          </button>
        )}
        {isEditing && (
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600"
            >
              <Check className="w-3 h-3" />
              保存
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                fetchInterests(); // 恢复原数据
              }}
              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* 显示兴趣标签 */}
      <div className="flex flex-wrap">
        {interests.map(interest => (
          <span
            key={interest}
            className={`interest-tag ${isEditing ? 'edit-mode' : ''}`}
            onClick={isEditing ? () => handleRemoveInterest(interest) : undefined}
          >
            {interest}
            {isEditing && <X className="w-3 h-3 ml-1" />}
          </span>
        ))}
        
        {interests.length === 0 && !isEditing && (
          <span className="text-sm text-gray-400">暫無興趣愛好</span>
        )}
      </div>

      {/* 添加新标签 */}
      {isEditing && interests.length < 20 && (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag.trim()) {
                  handleAddInterest(newTag.trim());
                }
              }}
              placeholder="添加興趣標籤"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={20}
            />
            <button
              onClick={() => handleAddInterest(newTag.trim())}
              disabled={!newTag.trim()}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* 预设标签 */}
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">快速添加：</p>
            <div className="flex flex-wrap gap-1">
              {PRESET_INTERESTS.filter(p => !interests.includes(p))
                .slice(0, 12)
                .map(preset => (
                  <button
                    key={preset}
                    onClick={() => handleAddInterest(preset)}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    + {preset}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 显示其他用户兴趣的只读组件
export function MemberInterests({ interests }: { interests: string[] }) {
  if (!interests || interests.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {interests.slice(0, 5).map(interest => (
        <span key={interest} className="interest-tag text-xs">
          {interest}
        </span>
      ))}
      {interests.length > 5 && (
        <span className="text-xs text-gray-400">+{interests.length - 5}</span>
      )}
    </div>
  );
}
