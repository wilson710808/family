/**
 * 公告管理模組
 */

import { db } from '../../lib/db';

export interface Announcement {
  id?: number;
  family_id: number;
  title: string;
  content: string;
  event_date?: string;
  event_time?: string;
  notify_days_before: number;
  created_by: number;
  created_at?: string;
}

/**
 * 獲取即將到來的公告（用於提前通知）
 */
export function getEarlyNotifications(db: any, today: string) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM plugin_butler_announcements
      WHERE event_date > ?
      AND notify_days_before > 0
      AND notified_early = 0
      ORDER BY event_date ASC
    `);
    return stmt.all(today);
  } catch (error) {
    console.error('[Announcements] getEarlyNotifications error:', error);
    return [];
  }
}

/**
 * 獲取今天的公告
 */
export function getTodaysAnnouncements(db: any, today: string) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM plugin_butler_announcements
      WHERE event_date = ?
      AND notified_today = 0
      ORDER BY created_at DESC
    `);
    return stmt.all(today);
  } catch (error) {
    console.error('[Announcements] getTodaysAnnouncements error:', error);
    return [];
  }
}

/**
 * 獲取今天的提醒事項
 */
export function getTodaysReminders(db: any, today: string) {
  try {
    const stmt = db.prepare(`
      SELECT r.*, u.name as creator_name 
      FROM plugin_butler_scheduled_reminders r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.remind_date = ?
      AND r.sent = 0
      ORDER BY r.remind_time ASC
    `);
    return stmt.all(today);
  } catch (error) {
    console.error('[Announcements] getTodaysReminders error:', error);
    return [];
  }
}

/**
 * 標記提前通知已發送
 */
export function markEarlyNotified(db: any, id: number) {
  try {
    const stmt = db.prepare(`
      UPDATE plugin_butler_announcements 
      SET notified_early = 1 
      WHERE id = ?
    `);
    stmt.run(id);
  } catch (error) {
    console.error('[Announcements] markEarlyNotified error:', error);
  }
}

/**
 * 標記今日通知已發送
 */
export function markTodayNotified(db: any, id: number) {
  try {
    const stmt = db.prepare(`
      UPDATE plugin_butler_announcements 
      SET notified_today = 1 
      WHERE id = ?
    `);
    stmt.run(id);
  } catch (error) {
    console.error('[Announcements] markTodayNotified error:', error);
  }
}

/**
 * 標記提醒已發送
 */
export function markReminderSent(db: any, id: number) {
  try {
    const stmt = db.prepare(`
      UPDATE plugin_butler_scheduled_reminders 
      SET sent = 1 
      WHERE id = ?
    `);
    stmt.run(id);
  } catch (error) {
    console.error('[Announcements] markReminderSent error:', error);
  }
}

/**
 * 獲取即將到來的公告（未來的）
 */
export function getUpcomingAnnouncements(db: any, familyId: number) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM plugin_butler_announcements
      WHERE family_id = ?
      AND event_date >= date('now')
      ORDER BY event_date ASC
      LIMIT 5
    `);
    return stmt.all(familyId);
  } catch (error) {
    console.error('[Announcements] getUpcomingAnnouncements error:', error);
    return [];
  }
}

/**
 * 獲取即將到來的提醒
 */
export function getUpcomingReminders(db: any, familyId: number) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM plugin_butler_scheduled_reminders
      WHERE family_id = ?
      AND remind_date >= date('now')
      ORDER BY remind_date ASC
      LIMIT 5
    `);
    return stmt.all(familyId);
  } catch (error) {
    console.error('[Announcements] getUpcomingReminders error:', error);
    return [];
  }
}

/**
 * 檢查今天是否為節日
 */
export function isTodayHoliday(): { isHoliday: boolean; name?: string } {
  const holidays: Record<string, string> = {
    '01-01': '元旦',
    '02-14': '情人節',
    '03-08': '婦女節',
    '04-04': '兒童節',
    '04-05': '清明節',
    '05-01': '勞動節',
    '05-04': '五四青年節',
    '06-01': '端午節',
    '09-10': '中秋節',
    '10-01': '國慶節',
    '10-31': '萬聖節',
    '11-11': '光棍節',
    '12-25': '聖誕節',
  };

  const today = new Date();
  const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (holidays[monthDay]) {
    return { isHoliday: true, name: holidays[monthDay] };
  }

  return { isHoliday: false };
}

/**
 * 保存公告
 */
export function saveAnnouncement(db: any, data: Announcement) {
  try {
    const stmt = db.prepare(`
      INSERT INTO plugin_butler_announcements 
      (family_id, title, content, event_date, event_time, notify_days_before, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const result = stmt.run(
      data.family_id,
      data.title,
      data.content,
      data.event_date || null,
      data.event_time || null,
      data.notify_days_before,
      data.created_by
    );
    return { id: result.lastInsertRowid };
  } catch (error) {
    console.error('[Announcements] saveAnnouncement error:', error);
    throw error;
  }
}

/**
 * 刪除公告
 */
export function deleteAnnouncement(db: any, id: number) {
  try {
    const stmt = db.prepare('DELETE FROM plugin_butler_announcements WHERE id = ?');
    stmt.run(id);
    return { success: true };
  } catch (error) {
    console.error('[Announcements] deleteAnnouncement error:', error);
    throw error;
  }
}

/**
 * 獲取所有公告
 */
export function getAllAnnouncements(db: any, familyId: number) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM plugin_butler_announcements
      WHERE family_id = ?
      ORDER BY event_date DESC
    `);
    return stmt.all(familyId);
  } catch (error) {
    console.error('[Announcements] getAllAnnouncements error:', error);
    return [];
  }
}

/**
 * 創建公告（API 版本）
 */
export function createAnnouncement(
  db: any,
  familyId: number,
  title: string,
  content: string,
  eventDate: string,
  eventTime?: string,
  notifyDaysBefore: number = 1,
  createdBy?: number
) {
  return saveAnnouncement(db, {
    family_id: familyId,
    title,
    content,
    event_date: eventDate,
    event_time: eventTime,
    notify_days_before: notifyDaysBefore,
    created_by: createdBy || 0,
  });
}
