/**
 * 數據庫初始化模組
 * 使用 better-sqlite3 實現
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'family.db');

// 創建數據庫連接
export const db = new Database(DB_PATH, {
  verbose: process.env.NODE_ENV !== 'production' ? console.log : undefined,
});

// 啟用 WAL 模式，提高並發性能
db.pragma('journal_mode = WAL');

// 初始化數據庫表結構
export function initializeDatabase() {
  // 用戶表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT,
      login_total INTEGER DEFAULT 0,
      login_30d INTEGER DEFAULT 0
    )
  `);

  // 家族表
  db.exec(`
    CREATE TABLE IF NOT EXISTS families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      creator_id INTEGER NOT NULL,
      referral_code TEXT UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 家族成員表
  db.exec(`
    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'pending',
      relationship TEXT DEFAULT '',
      contribution_points INTEGER DEFAULT 0,
      contribution_stars INTEGER DEFAULT 1,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(family_id, user_id)
    )
  `);

  // 聊天消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      message_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 公告表（家族管家插件）
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_butler_announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      event_date TEXT,
      event_time TEXT,
      notify_days_before INTEGER DEFAULT 1,
      created_by INTEGER DEFAULT 0,
      notified_early INTEGER DEFAULT 0,
      notified_today INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id)
    )
  `);

  // 提醒事項表（家族管家插件）
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_butler_scheduled_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      remind_date TEXT NOT NULL,
      remind_time TEXT,
      created_by INTEGER DEFAULT 0,
      sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id)
    )
  `);

  // 管家回覆表（家族管家插件）
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_butler_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      message_id INTEGER,
      content TEXT NOT NULL,
      trigger_type TEXT DEFAULT 'auto',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id)
    )
  `);

  // 每日摘要表（家族管家插件）
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_butler_daily_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      summary_date TEXT NOT NULL,
      summary_text TEXT NOT NULL,
      key_topics TEXT,
      key_members TEXT,
      mood_score INTEGER DEFAULT 7,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id)
    )
  `);

  // 用戶畫像表（家族管家插件）
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_butler_user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      personality_traits TEXT DEFAULT '[]',
      concerns TEXT DEFAULT '[]',
      achievements TEXT DEFAULT '[]',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(family_id, user_id)
    )
  `);

  // 創建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_family ON chat_messages(family_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
    CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_plugin_butler_date ON plugin_butler_announcements(event_date);
  `);

  console.log('[Database] 初始化完成');
}

// 導出默認數據庫實例
export default db;
