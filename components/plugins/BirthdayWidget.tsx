'use client';

import { useState, useEffect } from 'react';
import { Gift, Calendar, Heart, PartyPopper, Sparkles, Clock } from 'lucide-react';
import { isEnabled, getUpcomingReminders } from '../../plugins/birthday-reminder';
import Link from 'next/link';

interface UpcomingReminder {
  id: number;
  user_id: number;
  family_id: number;
  reminder_type: 'birthday' | 'anniversary' | 'custom';
  title: string;
  birth_date: string;
  year: number | null;
  daysUntil: number;
  age: number | null;
  user_avatar?: string;
}

interface BirthdayWidgetProps {
  familyId: number;
  maxItems?: number;
}

export default function BirthdayWidget({ familyId, maxItems = 5 }: BirthdayWidgetProps) {
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchUpcoming();
    }
  }, [familyId]);

  async function fetchUpcoming() {
    try {
      const res = await fetch(`/api/plugins/birthday/upcoming?familyId=${familyId}&daysAhead=30`);
      const data = await res.json();
      
      if (!data.enabled) {
        setEnabled(false);
        setLoading(false);
        return;
      }

      if (data.success) {
        setReminders(data.reminders.slice(0, maxItems));
      }
    } catch (error) {
      console.error('[BirthdayWidget] Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  function getDaysText(days: number) {
    if (days === 0) return '今天！';
    if (days === 1) return '明天';
    return `${days} 天后`;
  }

  function getUrgencyLevel(days: number): 'today' | 'soon' | 'normal' {
    if (days === 0) return 'today';
    if (days <= 3) return 'soon';
    return 'normal';
  }

  function getUrgencyStyles(level: 'today' | 'soon' | 'normal') {
    switch (level) {
      case 'today':
        return {
          bg: 'bg-gradient-to-r from-pink-500 to-rose-500',
          text: 'text-white',
          badge: 'bg-white text-pink-600 animate-pulse',
          icon: <PartyPopper className="w-5 h-5" />,
        };
      case 'soon':
        return {
          bg: 'bg-gradient-to-r from-purple-500 to-indigo-500',
          text: 'text-white',
          badge: 'bg-yellow-400 text-yellow-900',
          icon: <Sparkles className="w-5 h-5" />,
        };
      default:
        return {
          bg: 'bg-white',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-600',
          icon: <Gift className="w-5 h-5 text-pink-500" />,
        };
    }
  }

  function getTypeIcon(type: string) {
    if (type === 'birthday') return <Gift className="w-4 h-4" />;
    if (type === 'anniversary') return <Heart className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  }

  // 今天的生日特别处理
  const todayBirthday = reminders.filter(r => r.daysUntil === 0);
  const soonBirthdays = reminders.filter(r => r.daysUntil > 0 && r.daysUntil <= 7);
  const otherReminders = reminders.filter(r => r.daysUntil > 7);

  return (
    <div className="space-y-3">
      {/* 今天的生日 - 大卡片 */}
      {todayBirthday.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <PartyPopper className="w-6 h-6 animate-bounce" />
            <h3 className="font-bold text-lg">今天生日！</h3>
          </div>
          <div className="space-y-2">
            {todayBirthday.map(reminder => (
              <div key={reminder.id} className="flex items-center justify-between bg-white/20 backdrop-blur rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {reminder.user_avatar ? (
                    <img src={reminder.user_avatar} alt={reminder.title} className="w-10 h-10 rounded-full border-2 border-white" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                      <Gift className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{reminder.title}</p>
                    <p className="text-sm text-white/80">
                      {reminder.age !== null && `满 ${reminder.age} 岁啦！`}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">🎂</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-sm text-white/90">
            🎉 快去送上祝福吧！
          </div>
        </div>
      )}

      {/* 本周生日 */}
      {soonBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-md p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold">本周即将到来</h3>
          </div>
          <div className="space-y-2">
            {soonBirthdays.map(reminder => {
              const urgency = getUrgencyStyles(getUrgencyLevel(reminder.daysUntil));
              return (
                <div key={reminder.id} className="flex items-center justify-between bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {reminder.user_avatar ? (
                      <img src={reminder.user_avatar} alt={reminder.title} className="w-10 h-10 rounded-full border-2 border-white/50" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        {getTypeIcon(reminder.reminder_type)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      <p className="text-sm text-white/80">
                        {reminder.age !== null && `${reminder.age} 岁`}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white text-purple-600 rounded-full text-sm font-medium">
                    {getDaysText(reminder.daysUntil)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 其他提醒 */}
      {otherReminders.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-700">其他提醒</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {otherReminders.map(reminder => {
              const urgency = getUrgencyStyles(getUrgencyLevel(reminder.daysUntil));
              return (
                <div key={reminder.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${urgency.bg}`}>
                      <span className={urgency.text}>
                        {getTypeIcon(reminder.reminder_type)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{reminder.title}</p>
                      <p className="text-sm text-gray-500">
                        {reminder.age !== null && reminder.reminder_type === 'birthday' 
                          ? `满 ${reminder.age} 岁`
                          : reminder.age !== null && reminder.reminder_type === 'anniversary'
                          ? `第 ${reminder.age} 周年`
                          : ''
                        }
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgency.badge}`}>
                    {getDaysText(reminder.daysUntil)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 管理链接 */}
      {reminders.length > 0 && (
        <Link 
          href={`/plugins/birthday?familyId=${familyId}`}
          className="block text-center text-sm text-blue-500 hover:text-blue-600 hover:underline py-2"
        >
          管理生日提醒 →
        </Link>
      )}
    </div>
  );
}
