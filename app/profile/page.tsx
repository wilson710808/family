'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useToast } from '@/components/ToastProvider';
import { User, Mail, Lock, Save, Camera, Shield, LogOut, Star } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  is_admin?: number;
  login_total?: number;
  last_login?: string;
  contribution_points?: number;
  contribution_stars?: number;
}

interface Family {
  id: number;
  name: string;
  role: string;
  contribution_stars: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // 编辑表单
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // 获取当前用户信息
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name);
          setEmail(data.user.email);
        } else {
          showToast('请先登录', 'error');
          router.push('/login');
        }
      })
      .catch(() => {
        showToast('获取用户信息失败', 'error');
        router.push('/login');
      });

    // 获取用户的家族信息
    fetch('/api/families')
      .then(res => res.json())
      .then(data => {
        if (data.families) {
          setFamilies(data.families.filter((f: any) => f.status === 'approved'));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router, showToast]);

  // 处理头像上传
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 验证文件类型和大小
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('只支持 JPG、PNG、GIF、WebP 格式的图片', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('图片大小不能超过 5MB', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUser(prev => prev ? { ...prev, avatar: data.avatar } : null);
        showToast('头像更新成功', 'success');
      } else {
        showToast(data.error || '头像更新失败', 'error');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      showToast('头像上传失败', 'error');
    }
  };

  // 保存个人信息
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('姓名和邮箱不能为空', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      if (data.success) {
        setUser(prev => prev ? { ...prev, name, email } : null);
        showToast('个人信息更新成功', 'success');
      } else {
        showToast(data.error || '更新失败', 'error');
      }
    } catch (error) {
      console.error('保存失败:', error);
      showToast('保存失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('请填写所有密码字段', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('两次输入的新密码不一致', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('新密码长度至少为 6 位', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('密码修改成功', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data.error || '密码修改失败', 'error');
      }
    } catch (error) {
      console.error('密码修改失败:', error);
      showToast('密码修改失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-gray-100">
            ←
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-8 w-8 text-green-500" />
              个人设置
            </h1>
            <p className="text-gray-600">管理您的个人资料和账户设置</p>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">头像设置</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-24 h-24 rounded-full object-cover"
              />
              <label className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition-colors">
                <Camera className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="text-gray-600">点击相机图标上传新头像</p>
              <p className="text-sm text-gray-400">支持 JPG、PNG、GIF、WebP 格式，最大 5MB</p>
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            基本信息
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="请输入邮箱"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            修改密码
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                当前密码
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="请输入当前密码"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="请输入新密码（至少6位）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="请再次输入新密码"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors"
              >
                <Lock className="w-5 h-5 mr-2" />
                {saving ? '修改中...' : '修改密码'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            账户统计
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{user.contribution_points || 0}</p>
              <p className="text-sm text-gray-500">总积分</p>
              {renderStars(user.contribution_stars || 1)}
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{user.login_total || 0}</p>
              <p className="text-sm text-gray-500">登录次数</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{families.length}</p>
              <p className="text-sm text-gray-500">加入家族</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {user.last_login ? new Date(user.last_login).toLocaleDateString('zh-CN') : '-'}
              </p>
              <p className="text-sm text-gray-500">最后登录</p>
            </div>
          </div>
        </div>

        {/* My Families */}
        {families.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              我的家族
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {families.map((family) => (
                <div key={family.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Link href={`/families/${family.id}`} className="flex items-center gap-3 flex-1 hover:bg-gray-100 rounded-lg p-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                      {family.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{family.name}</p>
                      <p className="text-sm text-gray-500">
                        {family.role === 'admin' ? '管理员' : '成员'}
                      </p>
                    </div>
                  </Link>
                  {renderStars(family.contribution_stars)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
