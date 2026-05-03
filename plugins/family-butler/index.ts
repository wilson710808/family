/**
 * Family Butler Plugin - 家族管家插件
 * 
 * 提供家族聊天室的 AI 管家功能：
 * - 智能回覆
 * - 生日提醒
 * - 節日祝福
 * - 每日摘要
 * - 定時通知
 */

export {
  generateButlerReply,
  generateBirthdayGreeting,
  generateHolidayGreeting,
  generateDailySummary,
  saveButlerReply,
  saveDailySummary,
  type ButlerContext,
  type AIGatewayResponse,
  type DailySummaryResult,
} from './ai-service';

// 公告相關函數
export {
  getEarlyNotifications,
  getTodaysAnnouncements,
  getTodaysReminders,
  markEarlyNotified,
  markTodayNotified,
  markReminderSent,
  getUpcomingAnnouncements,
  getUpcomingReminders,
  isTodayHoliday,
  saveAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  createAnnouncement,
} from './announcements';

// 提醒事項相關函數
export {
  saveReminder,
  deleteReminder,
  getAllReminders,
  getFamilyReminders,
} from './reminders';

// 用戶畫像相關函數
export {
  updateUserProfile,
  getFamilyMemberProfiles,
  getRecentDailySummaries,
  analyzeUserPersonality,
} from './user-profile';
