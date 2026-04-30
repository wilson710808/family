import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// 获取/更新当前用户的兴趣标签
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    // 确保表存在
    ensureTableExists();

    const result = db.prepare(`
      SELECT interests FROM user_interests WHERE user_id = ?
    `).get(user.id) as { interests: string } | undefined;

    const interests = result?.interests ? JSON.parse(result.interests) : [];

    return NextResponse.json({ success: true, interests });
  } catch (error) {
    console.error('获取兴趣标签失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}

// 更新当前用户的兴趣标签
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { interests } = body;

    if (!Array.isArray(interests)) {
      return NextResponse.json({ success: false, error: '兴趣必须是数组' }, { status: 400 });
    }

    // 限制最多20个标签
    const limitedInterests = interests.slice(0, 20).map((tag: string) => tag.trim()).filter(Boolean);

    // 确保表存在
    ensureTableExists();

    // 使用 upsert 语法
    db.prepare(`
      INSERT INTO user_interests (user_id, interests, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        interests = excluded.interests,
        updated_at = excluded.updated_at
    `).run(user.id, JSON.stringify(limitedInterests), new Date().toISOString());

    return NextResponse.json({ success: true, interests: limitedInterests });
  } catch (error) {
    console.error('更新兴趣标签失败:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
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
