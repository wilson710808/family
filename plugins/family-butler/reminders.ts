/**
 * 提醒事項管理模組
 */

import { db } from '../../lib/db';

export interface Reminder {
  id?: number;
  family_id: number;
  content: string;
  remind_date: string;
  remind_time?: string;
  created_by: number;
  sent?: number;
  created_at?: string;
}

/**
 * 保存提醒
 */
export function saveReminder(db: any, data: Reminder) {
  try {
    const stmt = db.prepare(`
      INSERT INTO plugin_butler_scheduled_reminders 
      (family_id, content, remind_date, remind_time, created_by, sent, created_at)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
    `);
    const result = stmt.run(
      data.family_id,
      data.content,
      data.remind_date,
      data.remind_time || null,
      data.created_by
    );
    return { id: result.lastInsertRowid };
  } catch (error) {
    console.error('[Reminders] saveReminder error:', error);
    throw error;
  }
}

/**
 * 刪除提醒
 */
export function deleteReminder(db: any, id: number) {
  try {
    const stmt = db.prepare('DELETE FROM plugin_butler_scheduled_reminders WHERE id = ?');
    stmt.run(id);
    return { success: true };
  } catch (error) {
    console.error('[Reminders] deleteReminder error:', error);
    throw error;
  }
}

/**
 * 獲取所有提醒
 */
export function getAllReminders(db: any, familyId: number) {
  try {
    const stmt = db.prepare(`
      SELECT r.*, u.name as creator_name
      FROM plugin_butler_scheduled_reminders r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.family_id = ?
      ORDER BY r.remind_date DESC, r.remind_time ASC
    `);
    return stmt.all(familyId);
  } catch (error) {
    console.error('[Reminders] getAllReminders error:', error);
    return [];
  }
}

/**
 * 獲取家族的提醒
 */
export function getFamilyReminders(db: any, familyId: number, limit: number = 10) {
  try {
    const stmt = db.prepare(`
      SELECT r.*, u.name as creator_name
      FROM plugin_butler_scheduled_reminders r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.family_id = ?
      ORDER BY r.remind_date ASC, r.remind_time ASC
      LIMIT ?
    `);
    return stmt.all(familyId, limit);
  } catch (error) {
    console.error('[Reminders] getFamilyReminders error:', error);
    return [];
  }
}
