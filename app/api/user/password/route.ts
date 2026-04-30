import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: '请填写所有密码字段' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: '新密码长度至少为 6 位' }, { status: 400 });
    }

    // 获取当前用户密码
    const userRecord = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string } | undefined;

    if (userRecord?.password_hash) {
      // 验证当前密码
      const isValid = await bcrypt.compare(currentPassword, userRecord.password_hash);
      if (!isValid) {
        return NextResponse.json({ success: false, error: '当前密码错误' }, { status: 400 });
      }
    }

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashedPassword, user.id);

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('密码修改失败:', error);
    return NextResponse.json({ success: false, error: '密码修改失败' }, { status: 500 });
  }
}
