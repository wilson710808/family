import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { messageId, content, familyId } = await request.json();
    if (!messageId || !content?.trim() || !familyId) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    // 检查消息是否存在且属于当前用户
    const message = db.prepare(`
      SELECT * FROM chat_messages WHERE id = ? AND family_id = ?
    `).get(messageId, familyId) as any;

    if (!message) {
      return NextResponse.json({ success: false, error: '消息不存在' }, { status: 404 });
    }

    if (message.user_id !== user.id) {
      return NextResponse.json({ success: false, error: '只能编辑自己的消息' }, { status: 403 });
    }

    // 检查消息时间，超过5分钟不允许编辑
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (now - messageTime > fiveMinutes) {
      return NextResponse.json({ success: false, error: '消息已超过5分钟，无法编辑' }, { status: 400 });
    }

    // 更新消息内容，添加编辑标记
    db.prepare(`
      UPDATE chat_messages 
      SET content = ?, edited_at = datetime('now')
      WHERE id = ?
    `).run(content.trim(), messageId);

    // 获取更新后的消息
    const updatedMessage = db.prepare(`
      SELECT cm.*, u.name as user_name, u.avatar as user_avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ?
    `).get(messageId);

    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error) {
    console.error('编辑消息失败:', error);
    return NextResponse.json({ success: false, error: '编辑失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');
    const familyId = searchParams.get('familyId');

    if (!messageId || !familyId) {
      return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 });
    }

    // 检查消息是否存在
    const message = db.prepare(`
      SELECT * FROM chat_messages WHERE id = ? AND family_id = ?
    `).get(messageId, familyId) as any;

    if (!message) {
      return NextResponse.json({ success: false, error: '消息不存在' }, { status: 404 });
    }

    // 只有消息发送者或管理员可以删除
    if (message.user_id !== user.id && user.is_admin !== 1) {
      return NextResponse.json({ success: false, error: '无权删除此消息' }, { status: 403 });
    }

    // 删除消息及其已读记录
    db.prepare(`DELETE FROM chat_message_reads WHERE message_id = ?`).run(messageId);
    db.prepare(`DELETE FROM chat_messages WHERE id = ?`).run(messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除消息失败:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
