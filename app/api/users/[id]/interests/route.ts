import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// 获取指定用户的兴趣标签（用于成员列表）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: '无效的用户ID' }, { status: 400 });
    }

    // 确保表存在
    ensureTableExists();

    const result = db.prepare(`
      SELECT interests FROM user_interests WHERE user_id = ?
    `).get(userId) as { interests: string } | undefined;

    const interests = result?.interests ? JSON.parse(result.interests) : [];

    return NextResponse.json({ success: true, interests });
  } catch (error) {
    console.error('获取用户兴趣标签失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}

// 确保表存在
function ensureTableExists() {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_interests (
        user_id INTEGER PRIMARY KEY,
        interests TEXT DEFAULT '[]',
        updated_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (error) {
    console.error('创建兴趣表失败:', error);
  }
}
