import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const familyId = searchParams.get('familyId');
  const keyword = searchParams.get('keyword');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!familyId) {
    return NextResponse.json({ success: false, error: '需要家族ID' }, { status: 400 });
  }

  try {
    let query = `
      SELECT 
        cm.id, 
        cm.family_id, 
        cm.user_id, 
        cm.content, 
        cm.created_at,
        cm.message_type,
        cm.edited_at,
        COALESCE(u.name, '聊天室管家') as user_name,
        COALESCE(u.avatar, 'https://api.dicebear.com/7.x/bottts/svg?seed=butler') as user_avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.family_id = ?
    `;
    const params: any[] = [Number(familyId)];

    // 如果有关键詞，添加搜索条件
    if (keyword && keyword.trim()) {
      query += ` AND cm.content LIKE ?`;
      params.push(`%${keyword.trim()}%`);
    }

    // 计算总数
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as count FROM'
    );
    const total = db.prepare(countQuery).get(...params) as { count: number };

    // 添加分页和排序
    query += ` ORDER BY cm.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const messages = db.prepare(query).all(...params);

    return NextResponse.json({
      success: true,
      messages,
      total: total.count,
      page,
      limit,
      totalPages: Math.ceil(total.count / limit)
    });
  } catch (error) {
    console.error('搜索聊天记录失败:', error);
    return NextResponse.json({ success: false, error: '搜索失败' }, { status: 500 });
  }
}
