import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');
  const type = searchParams.get('type') || 'all'; // all, families, members, messages, announcements
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!keyword || !keyword.trim()) {
    return NextResponse.json({ success: false, error: '請輸入關鍵詞' }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }

    const results: any = {
      families: [],
      members: [],
      messages: [],
      announcements: [],
    };

    const searchTerm = `%${keyword.trim()}%`;

    // 搜索家族
    if (type === 'all' || type === 'families') {
      const families = db.prepare(`
        SELECT f.*, fm.role
        FROM families f
        JOIN family_members fm ON f.id = fm.family_id
        WHERE fm.user_id = ? AND fm.status = 'approved'
          AND (f.name LIKE ? OR f.description LIKE ?)
        LIMIT ?
      `).all(user.id, searchTerm, searchTerm, limit);

      results.families = families;
    }

    // 搜索成员（搜索用户名称）
    if (type === 'all' || type === 'members') {
      const members = db.prepare(`
        SELECT DISTINCT u.id, u.name, u.avatar, fm.family_id, fm.role, fm.contribution_points
        FROM users u
        JOIN family_members fm ON u.id = fm.user_id
        WHERE fm.family_id IN (
          SELECT family_id FROM family_members WHERE user_id = ? AND status = 'approved'
        )
          AND fm.status = 'approved'
          AND u.name LIKE ?
        LIMIT ?
      `).all(user.id, searchTerm, limit);

      results.members = members;
    }

    // 搜索聊天消息
    if (type === 'all' || type === 'messages') {
      const messages = db.prepare(`
        SELECT cm.*, u.name as user_name, u.avatar as user_avatar, f.name as family_name
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        JOIN families f ON cm.family_id = f.id
        WHERE cm.family_id IN (
          SELECT family_id FROM family_members WHERE user_id = ? AND status = 'approved'
        )
          AND cm.content LIKE ?
        ORDER BY cm.created_at DESC
        LIMIT ?
      `).all(user.id, searchTerm, limit);

      results.messages = messages;
    }

    // 搜索公告
    if (type === 'all' || type === 'announcements') {
      const announcements = db.prepare(`
        SELECT a.*, f.name as family_name
        FROM announcements a
        JOIN families f ON a.family_id = f.id
        WHERE a.family_id IN (
          SELECT family_id FROM family_members WHERE user_id = ? AND status = 'approved'
        )
          AND (a.title LIKE ? OR a.content LIKE ?)
        ORDER BY a.created_at DESC
        LIMIT ?
      `).all(user.id, searchTerm, searchTerm, limit);

      results.announcements = announcements;
    }

    // 计算总数
    const total =
      results.families.length +
      results.members.length +
      results.messages.length +
      results.announcements.length;

    return NextResponse.json({
      success: true,
      results,
      total,
      keyword: keyword.trim(),
      page,
      limit,
    });
  } catch (error) {
    console.error('全局搜索失敗:', error);
    return NextResponse.json({ success: false, error: '搜索失敗' }, { status: 500 });
  }
}
