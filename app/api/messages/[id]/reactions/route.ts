import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// 预设表情列表
const EMOJI_LIST = ['👍', '❤️', '😊', '🎉', '🔥', '💯', '👏', '🙌'];

// 获取消息的表情回应
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messageId = parseInt(id);

    if (isNaN(messageId)) {
      return NextResponse.json({ success: false, error: '无效的消息ID' }, { status: 400 });
    }

    // 确保表存在
    ensureTableExists();

    // 获取该消息的所有表情回应
    const reactions = db.prepare(`
      SELECT emoji, user_id, created_at 
      FROM message_reactions 
      WHERE message_id = ?
      ORDER BY created_at DESC
    `).all(messageId) as { emoji: string; user_id: number; created_at: string }[];

    // 统计每个表情的数量和用户
    const reactionSummary = EMOJI_LIST.map(emoji => {
      const users = reactions.filter(r => r.emoji === emoji);
      return {
        emoji,
        count: users.length,
        users: users.map(r => r.user_id)
      };
    }).filter(r => r.count > 0);

    return NextResponse.json({ success: true, reactions: reactionSummary });
  } catch (error) {
    console.error('获取表情回应失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}

// 添加/更新表情回应
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const messageId = parseInt(id);

    if (isNaN(messageId)) {
      return NextResponse.json({ success: false, error: '无效的消息ID' }, { status: 400 });
    }

    const body = await request.json();
    const { emoji } = body;

    if (!EMOJI_LIST.includes(emoji)) {
      return NextResponse.json({ success: false, error: '无效的表情' }, { status: 400 });
    }

    // 确保表存在
    ensureTableExists();

    // 检查用户是否已经对该消息添加了这个表情
    const existing = db.prepare(`
      SELECT id FROM message_reactions 
      WHERE message_id = ? AND user_id = ? AND emoji = ?
    `).get(messageId, user.id, emoji);

    if (existing) {
      // 取消点赞（toggle）
      db.prepare(`
        DELETE FROM message_reactions 
        WHERE message_id = ? AND user_id = ? AND emoji = ?
      `).run(messageId, user.id, emoji);

      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // 添加表情回应
      db.prepare(`
        INSERT INTO message_reactions (message_id, user_id, emoji, created_at)
        VALUES (?, ?, ?, ?)
      `).run(messageId, user.id, emoji, new Date().toISOString());

      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error) {
    console.error('添加表情回应失败:', error);
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 });
  }
}

// 确保表存在
function ensureTableExists() {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER,
        user_id INTEGER,
        emoji TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id, emoji)
      )
    `).run();
  } catch (error) {
    console.error('创建表情回应表失败:', error);
  }
}
