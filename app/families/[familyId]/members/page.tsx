'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useToast } from '@/components/ToastProvider';
import { Users, Plus, Clock, User, Trash2, Shield, Crown, Star, UserMinus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Member {
  id: number;
  name: string;
  avatar: string;
  login_total: number;
  last_login: string;
  role: 'founder' | 'admin' | 'member';
  status: string;
  relationship: string;
  contribution_points: number;
  contribution_stars: number;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  avatar: string;
  is_admin?: number;
}

interface Family {
  id: number;
  name: string;
  description: string;
  avatar: string;
}

function MembersContent() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get('familyId');
  const router = useRouter();
  const { showToast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKickConfirm, setShowKickConfirm] = useState<number | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferMember, setSelectedTransferMember] = useState<Member | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    if (!familyId) return;
    
    // 获取家族信息
    fetch(`/api/families/${familyId}`)
      .then(res => res.json())
      .then(data => {
        if (data.family) {
          setFamily(data.family);
        }
      });

    // 获取成员列表
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/families/${familyId}/members`);
        const data = await res.json();
        if (data.success) {
          setMembers(data.members);
        }
      } catch (error) {
        console.error('获取成员失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [familyId]);

  // 获取角色标签和图标
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'founder':
        return { label: '创始人', icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'admin':
        return { label: '管理员', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' };
      default:
        return { label: '成员', icon: User, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // 踢除成员
  const handleKickMember = async (memberId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/families/${familyId}/members?familyId=${familyId}&memberId=${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        showToast('成员已移除', 'success');
      } else {
        showToast(data.error || '移除失败', 'error');
      }
    } catch (error) {
      console.error('移除成员失败:', error);
      showToast('移除失败，请重试', 'error');
    } finally {
      setActionLoading(false);
      setShowKickConfirm(null);
    }
  };

  // 转让管理员
  const handleTransferAdmin = async (memberId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/families/${familyId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId, newAdminId: memberId }),
      });
      const data = await res.json();
      if (data.success) {
        // 更新本地状态
        setMembers(prev => prev.map(m => {
          if (m.id === memberId) return { ...m, role: 'admin' as const };
          if (m.id === user?.id) return { ...m, role: 'member' as const };
          return m;
        }));
        showToast('管理员已转让', 'success');
      } else {
        showToast(data.error || '转让失败', 'error');
      }
    } catch (error) {
      console.error('转让管理员失败:', error);
      showToast('转让失败，请重试', 'error');
    } finally {
      setActionLoading(false);
      setShowTransferModal(false);
      setSelectedTransferMember(null);
    }
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // 检查当前用户是否是管理员
  const isAdmin = () => {
    const currentMember = members.find(m => m.id === user?.id);
    return currentMember?.role === 'admin' || currentMember?.role === 'founder';
  };

  // 渲染星星
  const renderStars = (stars: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  if (!familyId) {
    return (
      <Layout user={user || { id: 0, name: '', avatar: '' }}>
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">請先選擇家族</p>
          <Link href="/families" className="text-blue-500 hover:underline">前往家族列表</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user || { id: 0, name: '', avatar: '' }}>
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <Link href={`/families/${familyId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回家族
        </Link>

        {/* 头部信息 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={family?.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=family'} alt={family?.name} className="w-16 h-16 rounded-full" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{family?.name} - 成员管理</h1>
                <p className="text-gray-500">共 {members.length} 位成员</p>
              </div>
            </div>
            {isAdmin() && (
              <Link 
                href={`/families/${familyId}/invite`}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                邀請成員
              </Link>
            )}
          </div>
        </div>

        {/* 成员列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">所有成员</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暫無成員</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {members.map(member => {
                const roleDisplay = getRoleDisplay(member.role);
                const RoleIcon = roleDisplay.icon;
                const isSelf = member.id === user?.id;

                return (
                  <div key={member.id} className={`p-4 hover:bg-gray-50 transition-colors ${isSelf ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            {isSelf && <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">(你)</span>}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${roleDisplay.bg} ${roleDisplay.color}`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleDisplay.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{member.contribution_points} 积分</span>
                            {renderStars(member.contribution_stars)}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(member.created_at)} 加入
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      {isAdmin() && !isSelf && member.role !== 'founder' && (
                        <div className="flex items-center gap-2">
                          {/* 转让管理员 */}
                          {member.role === 'member' && (
                            <button
                              onClick={() => { setSelectedTransferMember(member); setShowTransferModal(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="转让管理员"
                            >
                              <Shield className="w-5 h-5" />
                            </button>
                          )}
                          {/* 踢除成员 */}
                          <button
                            onClick={() => setShowKickConfirm(member.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="移除成员"
                          >
                            <UserMinus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 踢除确认弹窗 */}
        {showKickConfirm !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserMinus className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">確認移除成員</h3>
                <p className="text-gray-500 mb-6">
                  確定要移除該成員嗎？此操作無法撤銷。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowKickConfirm(null)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleKickMember(showKickConfirm)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300"
                  >
                    {actionLoading ? '處理中...' : '確認移除'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 转让管理员确认弹窗 */}
        {showTransferModal && selectedTransferMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">轉讓管理員權限</h3>
                <p className="text-gray-500 mb-4">
                  確定要將管理員權限轉讓給 <span className="font-semibold text-blue-600">{selectedTransferMember.name}</span> 嗎？
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  轉讓後你將變為普通成員，無法撤回。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowTransferModal(false); setSelectedTransferMember(null); }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleTransferAdmin(selectedTransferMember.id)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {actionLoading ? '處理中...' : '確認轉讓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 成员等级说明 */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-4">成員等級說明</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-600" />
              <strong>創始人：</strong>家族的創建者，擁有最高權限
            </li>
            <li className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <strong>管理員：</strong>協助管理家族，踢除成員、轉讓管理員
            </li>
            <li className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <strong>成員：</strong>普通成員，參與家族活動
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>星星評級：</strong>
              <span className="ml-2">1⭐ 新手成員 (0-99 积分)</span> |
              <span> 2⭐ 活跃成员 (100-299 积分)</span> |
              <span> 3⭐ 核心成员 (300-599 积分)</span>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <span>4⭐ 资深成员 (600-999 积分)</span> |
              <span> 5⭐ 顶流贡献 (1000+ 积分)</span>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function MembersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">加载中...</p>
    </div>}>
      <MembersContent />
    </Suspense>
  );
}

export default MembersPage;
