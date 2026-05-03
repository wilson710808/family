/**
 * 用戶畫像模組
 */

import { db } from '../../lib/db';

export interface UserProfile {
  id?: number;
  family_id: number;
  user_id: number;
  user_name?: string;
  personality_traits?: string;
  concerns?: string;
  achievements?: string;
  updated_at?: string;
}

/**
 * 更新用戶畫像
 */
export function updateUserProfile(
  db: any,
  familyId: number,
  userId: number,
  data: {
    personality_traits?: string[];
    concerns?: string[];
    achievements?: string[];
  }
) {
  try {
    // 檢查是否存在
    const existing = db.prepare(`
      SELECT id FROM plugin_butler_user_profiles 
      WHERE family_id = ? AND user_id = ?
    `).get(familyId, userId);

    if (existing) {
      // 更新
      const updates: string[] = [];
      const values: any[] = [];

      if (data.personality_traits) {
        updates.push('personality_traits = ?');
        values.push(JSON.stringify(data.personality_traits));
      }
      if (data.concerns) {
        updates.push('concerns = ?');
        values.push(JSON.stringify(data.concerns));
      }
      if (data.achievements) {
        updates.push('achievements = ?');
        values.push(JSON.stringify(data.achievements));
      }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        values.push(familyId, userId);
        
        const stmt = db.prepare(`
          UPDATE plugin_butler_user_profiles 
          SET ${updates.join(', ')}
          WHERE family_id = ? AND user_id = ?
        `);
        stmt.run(...values);
      }
    } else {
      // 創建
      const stmt = db.prepare(`
        INSERT INTO plugin_butler_user_profiles 
        (family_id, user_id, personality_traits, concerns, achievements, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(
        familyId,
        userId,
        data.personality_traits ? JSON.stringify(data.personality_traits) : '[]',
        data.concerns ? JSON.stringify(data.concerns) : '[]',
        data.achievements ? JSON.stringify(data.achievements) : '[]'
      );
    }

    return { success: true };
  } catch (error) {
    console.error('[UserProfile] updateUserProfile error:', error);
    throw error;
  }
}

/**
 * 獲取家族成員畫像
 */
export function getFamilyMemberProfiles(db: any, familyId: number) {
  try {
    const stmt = db.prepare(`
      SELECT p.*, u.name as user_name
      FROM plugin_butler_user_profiles p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.family_id = ?
      ORDER BY p.updated_at DESC
    `);
    return stmt.all(familyId);
  } catch (error) {
    console.error('[UserProfile] getFamilyMemberProfiles error:', error);
    return [];
  }
}

/**
 * 獲取最近的每日摘要
 */
export function getRecentDailySummaries(db: any, familyId: number, limit: number = 7) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM plugin_butler_daily_summaries
      WHERE family_id = ?
      ORDER BY summary_date DESC
      LIMIT ?
    `);
    return stmt.all(familyId, limit);
  } catch (error) {
    console.error('[UserProfile] getRecentDailySummaries error:', error);
    return [];
  }
}

/**
 * 分析用戶性格特徵（從聊天記錄中）
 */
export async function analyzeUserPersonality(
  messages: Array<{ user_name: string; content: string }>,
  userName: string
): Promise<{
  personality_traits: string[];
  concerns: string[];
  achievements: string[];
}> {
  // 這裡可以調用 AI 來分析，但簡化版本直接返回空
  return {
    personality_traits: [],
    concerns: [],
    achievements: [],
  };
}
