'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { Search, Users, MessageSquare, Bell, User, FileText, Clock, Shield, Crown } from 'lucide-react';

interface SearchResult {
  families?: any[];
  members?: any[];
  messages?: any[];
  announcements?: any[];
}

interface User {
  id: number;
  name: string;
  avatar: string;
  is_admin?: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || '';
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [results, setResults] = useState<SearchResult>({});
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    // 获取当前用户信息
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', is_admin: 1 });
        }
      })
      .catch(() => {
        setUser({ id: 1, name: '系统管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', is_admin: 1 });
      });
  }, []);

  // 如果有初始关键词，自动搜索
  useEffect(() => {
    if (initialKeyword) {
      handleSearch(initialKeyword);
    }
  }, [initialKeyword]);

  const handleSearch = async (searchKeyword?: string) => {
    const query = searchKeyword || keyword;
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setTotalResults(data.total);
        
        // 更新 URL
        if (router) {
          router.replace(`/search?keyword=${encodeURIComponent(query)}`);
        }
      }
    } catch (error) {
      console.error('搜索失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  // 获取角色图标
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'founder':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Layout user={user || { id: 0, name: '', avatar: '' }}>
      <div className="max-w-4xl mx-auto">
        {/* 搜索框 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-6 h-6" />
            全局搜索
          </h1>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索家族、成员、消息、公告..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                autoFocus
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !keyword.trim()}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-5 h-5" />
              )}
              搜索
            </button>
          </div>
        </div>

        {/* 搜索结果 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-4">搜索中...</p>
          </div>
        ) : hasSearched ? (
          <>
            {/* 结果统计 */}
            <div className="mb-4">
              <p className="text-gray-600">
                找到 <span className="font-bold text-green-600">{totalResults}</span> 個結果
                {totalResults > 0 && <span className="text-gray-400">（關鍵詞：「{keyword}」）</span>}
              </p>
            </div>

            {totalResults === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">沒有找到相關結果</h3>
                <p className="text-gray-500">請嘗試其他關鍵詞</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 家族结果 */}
                {results.families && results.families.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-500" />
                      <h2 className="font-bold text-gray-900">家族</h2>
                      <span className="text-sm text-gray-500">({results.families.length})</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {results.families.map((family: any) => (
                        <Link
                          key={family.id}
                          href={`/families/${family.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          <img src={family.avatar} alt={family.name} className="w-12 h-12 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{family.name}</h3>
                              {getRoleIcon(family.role)}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{family.description || '暫無描述'}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 成员结果 */}
                {results.members && results.members.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-500" />
                      <h2 className="font-bold text-gray-900">成員</h2>
                      <span className="text-sm text-gray-500">({results.members.length})</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {results.members.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{member.name}</h3>
                              {getRoleIcon(member.role)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {member.contribution_points} 積分
                              {member.family_name && ` · ${member.family_name}`}
                            </p>
                          </div>
                          <Link
                            href={`/families/${member.family_id}/members`}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            查看
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 消息结果 */}
                {results.messages && results.messages.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-500" />
                      <h2 className="font-bold text-gray-900">聊天消息</h2>
                      <span className="text-sm text-gray-500">({results.messages.length})</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {results.messages.map((message: any) => (
                        <Link
                          key={message.id}
                          href={`/chat?familyId=${message.family_id}`}
                          className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          <img src={message.user_avatar} alt={message.user_name} className="w-10 h-10 rounded-full flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{message.user_name}</span>
                              <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>
                              <span className="text-xs text-gray-400">· {message.family_name}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {message.content.length > 150 ? message.content.slice(0, 150) + '...' : message.content}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 公告结果 */}
                {results.announcements && results.announcements.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-red-500" />
                      <h2 className="font-bold text-gray-900">公告</h2>
                      <span className="text-sm text-gray-500">({results.announcements.length})</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {results.announcements.map((announcement: any) => (
                        <Link
                          key={announcement.id}
                          href={`/announcements?familyId=${announcement.family_id}`}
                          className="block p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                                <span className="text-xs text-gray-400">· {announcement.family_name}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {announcement.content.length > 150 ? announcement.content.slice(0, 150) + '...' : announcement.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {formatTime(announcement.created_at)}
                                {announcement.is_pinned && (
                                  <span className="text-red-500">· 置頂</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">開始搜索</h3>
            <p className="text-gray-500">輸入關鍵詞搜索家族、成員、消息或公告</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">加載中...</p>
    </div>}>
      <SearchContent />
    </Suspense>
  );
}

export default SearchPage;
