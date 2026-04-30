import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: '姓名和邮箱不能为空' }, { status: 400 });
    }

    // 检查邮箱是否已被其他用户使用
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, user.id);
    if (existing) {
      return NextResponse.json({ success: false, error: '该邮箱已被其他用户使用' }, { status: 400 });
    }

    // 更新用户信息
    db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, user.id);

    return NextResponse.json({ success: true, message: '资料更新成功' });
  } catch (error) {
    console.error('更新资料失败:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}
