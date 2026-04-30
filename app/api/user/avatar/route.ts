import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: '没有上传文件' }, { status: 400 });
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: '只支持 JPG、PNG、GIF、WebP 格式' }, { status: 400 });
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '文件大小不能超过 5MB' }, { status: 400 });
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar_${user.id}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 更新数据库中的头像URL
    const avatarUrl = `/uploads/avatars/${fileName}`;
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, user.id);

    return NextResponse.json({ success: true, avatar: avatarUrl });
  } catch (error) {
    console.error('头像上传失败:', error);
    return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
  }
}
