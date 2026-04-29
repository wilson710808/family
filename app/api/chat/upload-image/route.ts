import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, addContributionPoints } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const familyId = formData.get('familyId') as string;

    if (!file || !familyId) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: '不支持的图片格式' }, { status: 400 });
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '图片大小不能超过5MB' }, { status: 400 });
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'uploads', 'chat', familyId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // 保存文件
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // 生成访问URL
    const imageUrl = `/api/uploads/chat/${familyId}/${filename}`;

    // 插入消息记录
    const result = db.prepare(`
      INSERT INTO chat_messages (family_id, user_id, content, message_type)
      VALUES (?, ?, ?, 'image')
    `).run(Number(familyId), user.id, imageUrl);

    // 添加贡献积分
    addContributionPoints(Number(familyId), user.id, 3);

    // 获取插入的消息
    const message = db.prepare(`
      SELECT cm.id, cm.family_id, cm.user_id, cm.content, cm.created_at, cm.message_type,
             u.name as user_name, u.avatar as user_avatar
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ?
    `).get(result.lastInsertRowid as number);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('上传图片失败:', error);
    return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
  }
}
