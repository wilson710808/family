/**
 * AI Gateway Service - 使用 ai-gateway API 實現家族管家 AI 功能
 * 
 * API Endpoint: POST https://www.herelai.fun/ws/05-ai-gateway/api/query
 * 
 * 請求格式:
 * {
 *   "app_id": "your_app_identifier",
 *   "user_id": "user_unique_id",
 *   "query_data": "用戶的問題或輸入內容",
 *   "messages": [...],
 *   "options": {
 *     "temperature": 0.7,
 *     "max_tokens": 2000
 *   }
 * }
 */

import { db } from '../../lib/db';

// 環境配置
const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || 'https://www.herelai.fun/ws/05-ai-gateway/api/query';
const AI_GATEWAY_APP_ID = process.env.AI_GATEWAY_APP_ID || 'family-butler';
const AI_GATEWAY_TIMEOUT = 60000; // 60 秒超時

export interface ButlerContext {
  familyId: number;
  userId: number;
  userName: string;
  message: string;
  recentMessages: Array<{ userName: string; content: string }>;
  context: {
    hasBirthdayToday?: boolean;
    birthdayPerson?: string;
    isHoliday?: boolean;
    holidayName?: string;
    upcomingEvents?: any[];
    upcomingReminders?: any[];
  };
  familyProfile?: {
    memberProfiles: Array<{
      user_name: string;
      personality_traits: string[];
      concerns: string[];
      achievements: string[];
    }>;
    recentSummaries: string[];
  };
}

export interface AIGatewayResponse {
  success: boolean;
  data?: {
    choices?: Array<{
      message?: {
        content?: string;
      };
      delta?: {
        content?: string;
      };
    }>;
    response?: string;
    error?: string;
  };
  error?: string;
}

/**
 * 調用 AI Gateway API
 */
async function callAIGateway(
  appId: string,
  userId: string,
  queryData: string,
  messages: Array<{ role: string; content: string }>,
  options: { temperature?: number; max_tokens?: number } = {}
): Promise<AIGatewayResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_GATEWAY_TIMEOUT);

  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        user_id: userId,
        query_data: queryData,
        messages,
        options: {
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 2000,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI Gateway API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('[AIGateway] API call failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 構建管家系統提示詞
 */
function buildSystemPrompt(context: ButlerContext): string {
  const { familyId, userName, context: ctx, familyProfile } = context;
  
  let prompt = `你是家族聊天室的智能管家，專為家庭成員提供溫暖、貼心的服務。

你的職責：
1. 回應家族成員的問題和請求
2. 提醒即將到來的活動和重要事項
3. 促進家庭成員之間的互動
4. 記錄和總結家庭重要事件

當前情況：
- 家族 ID: ${familyId}
- 用戶名: ${userName}`;

  // 添加生日信息
  if (ctx.hasBirthdayToday) {
    prompt += `\n- 今天是 ${ctx.birthdayPerson} 的生日！記得送上祝福！`;
  }

  // 添加節日信息
  if (ctx.isHoliday && ctx.holidayName) {
    prompt += `\n- 今天是 ${ctx.holidayName}，可以發送節日祝福！`;
  }

  // 添加即將到來的事件
  if (ctx.upcomingEvents && ctx.upcomingEvents.length > 0) {
    prompt += `\n\n即將到來的事件：`;
    ctx.upcomingEvents.slice(0, 3).forEach((event: any) => {
      prompt += `\n- ${event.title} (${event.event_date})`;
    });
  }

  // 添加提醒事項
  if (ctx.upcomingReminders && ctx.upcomingReminders.length > 0) {
    prompt += `\n\n提醒事項：`;
    ctx.upcomingReminders.slice(0, 3).forEach((reminder: any) => {
      prompt += `\n- ${reminder.content} (${reminder.remind_date})`;
    });
  }

  // 添加家庭畫像信息
  if (familyProfile && familyProfile.memberProfiles.length > 0) {
    prompt += `\n\n家庭成員畫像：`;
    familyProfile.memberProfiles.slice(0, 5).forEach((profile) => {
      prompt += `\n- ${profile.user_name}:`;
      if (profile.personality_traits.length > 0) {
        prompt += ` 特質：${profile.personality_traits.join('、')}`;
      }
      if (profile.concerns.length > 0) {
        prompt += ` 關注：${profile.concerns.join('、')}`;
      }
    });
  }

  // 添加歷史摘要
  if (familyProfile && familyProfile.recentSummaries.length > 0) {
    prompt += `\n\n家庭最近摘要：`;
    familyProfile.recentSummaries.slice(0, 2).forEach((summary, i) => {
      prompt += `\n[${i + 1}] ${summary}`;
    });
  }

  prompt += `

回复要求：
1. 使用繁體中文
2. 溫暖、親切、有禮貌
3. 適當使用 emoji 增加活力
4. 如果有重要提醒，記得提醒用戶
5. 回覆簡潔有力，不要太長（100-300字為佳）
6. 如果用戶詢問家庭相關的事項，結合家庭畫像和歷史摘要給出更個性化的回覆

現在，用戶 "${userName}" 發送了消息：「${context.message}」
請以管家身份回覆這條消息。`;

  return prompt;
}

/**
 * 生成管家回覆
 */
export async function generateButlerReply(context: ButlerContext): Promise<string> {
  const { familyId, userId, userName, message, recentMessages, context: ctx, familyProfile } = context;

  try {
    // 構建歷史消息
    const historyMessages: Array<{ role: string; content: string }> = recentMessages.map((msg) => ({
      role: msg.userName === '聊天室管家' ? 'assistant' : 'user',
      content: `${msg.userName}：${msg.content}`,
    }));

    // 構建系統提示詞
    const systemPrompt = buildSystemPrompt(context);
    historyMessages.unshift({ role: 'system', content: systemPrompt });

    // 添加當前用戶消息
    historyMessages.push({ role: 'user', content: message });

    // 調用 AI Gateway
    const result = await callAIGateway(
      AI_GATEWAY_APP_ID,
      `family-${familyId}-user-${userId}`,
      message,
      historyMessages,
      { temperature: 0.7, max_tokens: 500 }
    );

    if (result.success && result.data) {
      // 嘗試從不同格式中提取回覆
      let reply = '';

      // 格式1: OpenAI 格式
      if (result.data.choices && result.data.choices[0]?.message?.content) {
        reply = result.data.choices[0].message.content;
      }
      // 格式2: 自定義格式
      else if (result.data.response) {
        reply = result.data.response;
      }

      if (reply) {
        // 保存到數據庫
        saveButlerReply(db, {
          family_id: familyId,
          message_id: Date.now(),
          content: reply,
          trigger_type: 'ai_response',
        });

        return reply.trim();
      }
    }

    throw new Error(result.error || 'AI 回覆為空');
  } catch (error: any) {
    console.error('[generateButlerReply] Error:', error);
    throw error;
  }
}

/**
 * 生成生日祝賀
 */
export async function generateBirthdayGreeting(birthdayPerson: string): Promise<string> {
  const systemPrompt = `你是家族聊天室的智能管家。今天是家族成員的生日，請生成一條溫暖的生日祝福。

要求：
1. 使用繁體中文
2. 溫暖、真誠
3. 適當使用生日相關 emoji
4. 50-100字以內`;

  const result = await callAIGateway(
    AI_GATEWAY_APP_ID,
    'birthday-greeting',
    `請為 ${birthdayPerson} 生成一條生日祝福`,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `請為 ${birthdayPerson} 生成一條生日祝福` },
    ],
    { temperature: 0.8, max_tokens: 200 }
  );

  if (result.success && result.data?.choices?.[0]?.message?.content) {
    return result.data.choices[0].message.content;
  }

  // 回退到默認祝福
  return `🎂 生日快樂！今天是 ${birthdayPerson} 的特別日子，祝願他/她生日快樂、身體健康、萬事如意！🎉`;
}

/**
 * 生成節日祝福
 */
export async function generateHolidayGreeting(holidayName: string): Promise<string> {
  const systemPrompt = `你是家族聊天室的智能管家。今天是 ${holidayName}，請生成一條節日祝福。

要求：
1. 使用繁體中文
2. 溫暖、真誠
3. 適當使用節日相關 emoji
4. 50-100字以內`;

  const result = await callAIGateway(
    AI_GATEWAY_APP_ID,
    'holiday-greeting',
    `今天${holidayName}，請生成祝福`,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `今天是 ${holidayName}，請生成祝福` },
    ],
    { temperature: 0.8, max_tokens: 200 }
  );

  if (result.success && result.data?.choices?.[0]?.message?.content) {
    return result.data.choices[0].message.content;
  }

  // 回退到默認祝福
  return `🎊 ${holidayName}快樂！祝大家節日愉快、闔家幸福！🎉`;
}

/**
 * 生成每日摘要
 */
export interface DailySummaryResult {
  summary_text: string;
  key_topics: string[];
  key_members: string[];
  mood_score: number;
}

export async function generateDailySummary(
  messages: Array<{ user_name: string; content: string; created_at: string }>
): Promise<DailySummaryResult> {
  const systemPrompt = `你是家族聊天室的智能管家。請根據以下聊天記錄生成一份每日摘要。

要求：
1. 使用繁體中文
2. 總結今天聊天的要點（100-200字）
3. 列出討論的主要話題
4. 標記最活躍的成員
5. 評估今天的氛圍（1-10分）
6. JSON 格式輸出：
{
  "summary_text": "摘要文字",
  "key_topics": ["話題1", "話題2"],
  "key_members": ["成員1", "成員2"],
  "mood_score": 7
}`;

  const messagesText = messages.map((m) => `${m.user_name}：${m.content}`).join('\n');

  const result = await callAIGateway(
    AI_GATEWAY_APP_ID,
    'daily-summary',
    `請根據以下聊天記錄生成摘要：\n${messagesText}`,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: messagesText },
    ],
    { temperature: 0.5, max_tokens: 1000 }
  );

  if (result.success && result.data?.choices?.[0]?.message?.content) {
    try {
      const content = result.data.choices[0].message.content;
      // 嘗試解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[generateDailySummary] JSON parse error:', e);
    }
  }

  // 回退到簡單摘要
  const activeMembers = [...new Set(messages.map((m) => m.user_name))];
  return {
    summary_text: `今天家族聊天室共有 ${messages.length} 條消息，${activeMembers.length} 位成員參與聊天。`,
    key_topics: ['日常聊天'],
    key_members: activeMembers.slice(0, 3),
    mood_score: 7,
  };
}

/**
 * 保存管家回覆到數據庫
 */
export function saveButlerReply(
  db: any,
  data: { family_id: number; message_id: number; content: string; trigger_type: string }
) {
  try {
    const stmt = db.prepare(`
      INSERT INTO plugin_butler_replies (family_id, message_id, content, trigger_type, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(data.family_id, data.message_id, data.content, data.trigger_type);
  } catch (error) {
    console.error('[saveButlerReply] Error:', error);
  }
}

/**
 * 保存每日摘要到數據庫
 */
export function saveDailySummary(
  db: any,
  data: {
    family_id: number;
    summary_date: string;
    summary_text: string;
    key_topics: string[];
    key_members: string[];
    mood_score: number;
  }
) {
  try {
    const stmt = db.prepare(`
      INSERT INTO plugin_butler_daily_summaries 
      (family_id, summary_date, summary_text, key_topics, key_members, mood_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(
      data.family_id,
      data.summary_date,
      data.summary_text,
      JSON.stringify(data.key_topics),
      JSON.stringify(data.key_members),
      data.mood_score
    );
  } catch (error) {
    console.error('[saveDailySummary] Error:', error);
  }
}
