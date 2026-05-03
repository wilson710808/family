/**
 * 生日提醒模組
 */

import { db } from '../../lib/db';

export interface Birthday {
  title: string;
  date: string;
  family_id: number;
}

/**
 * 獲取今天生日的成員
 */
export function getTodaysBirthdays(familyId: number): Birthday[] {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${month}-${day}`;

    // 檢查是否有成員記錄的生日在今天
    // 這裡可以根據實際的數據結構調整
    const stmt = db.prepare(`
      SELECT 
        u.name as title,
        u.avatar,
        fm.family_id
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = ?
      AND (
        -- 這裡需要根據實際的生日字段來查詢
        -- 暫時返回空數組
        1 = 0
      )
    `);

    return stmt.all(familyId);
  } catch (error) {
    console.error('[BirthdayReminder] getTodaysBirthdays error:', error);
    return [];
  }
}

/**
 * 獲取即將到來的生日（未來7天）
 */
export function getUpcomingBirthdays(familyId: number, days: number = 7): Birthday[] {
  try {
    // 這裡需要根據實際的數據結構來實現
    return [];
  } catch (error) {
    console.error('[BirthdayReminder] getUpcomingBirthdays error:', error);
    return [];
  }
}

/**
 * 添加成員生日
 */
export function addMemberBirthday(
  db: any,
  familyId: number,
  userId: number,
  birthday: string
) {
  try {
    // 這裡需要根據實際的數據結構來實現
    console.log('[BirthdayReminder] addMemberBirthday:', { familyId, userId, birthday });
    return { success: true };
  } catch (error) {
    console.error('[BirthdayReminder] addMemberBirthday error:', error);
    throw error;
  }
}
