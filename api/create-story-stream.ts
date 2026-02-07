/**
 * 故事流式生成 - Edge Function
 * POST /api/create/story/stream
 * 通过 Vercel rewrite 从 /api/create/story/stream 映射到此文件
 */

export const config = { runtime: 'edge' };

import { getUserFromRequest } from './_edge/auth.js';
import { createSSE } from './_edge/sse.js';
import { sql } from '@vercel/postgres';
import {
  STORY_SYSTEM_PROMPT,
  STORY_STYLE_MAP,
} from './_lib/prompts.config.js';
import { saveStoryToDb } from './modules/_story/db-save.js';
import type { StoryDoneData } from './_lib/sse.types.js';

// 构建故事用户 Prompt（与 stream-handler.ts 中逻辑一致）
function buildStoryUserPrompt(params: {
  theme: string;
  childName?: string;
  childAge?: number;
  childGender?: string;
  style?: string;
}): string {
  const { theme, childName, childAge, childGender, style } = params;

  let prompt = `请为我创作一个关于"${theme}"的童话故事。`;

  if (childName) {
    prompt += `\n主角名字叫"${childName}"。`;
  }

  if (childGender) {
    const genderText = childGender === 'male' ? '男孩' : '女孩';
    prompt += `\n主角是一个${childAge}岁的${genderText}。`;
  }

  if (style && STORY_STYLE_MAP[style]) {
    prompt += `\n故事风格要求：${STORY_STYLE_MAP[style]}。`;
  }

  return prompt;
}

// 生成 ID
function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${randomStr}`;
}

// 限流检查（与 api/index.ts 逻辑一致）
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limit = 10;
  const windowMs = 60 * 60 * 1000;
  const now = Date.now();
  const cutoffTime = new Date(now - windowMs);

  sql`DELETE FROM rate_limits WHERE created_at < ${cutoffTime.toISOString()}`.catch(err =>
    console.error('[限流] 清理过期记录失败:', err)
  );

  const result = await sql`
    SELECT COUNT(*) as count, MIN(created_at) as oldest
    FROM rate_limits
    WHERE user_id = ${userId} AND created_at >= ${cutoffTime.toISOString()}
  `;

  const count = parseInt(result.rows[0].count);
  if (count >= limit) {
    const oldestTime = new Date(result.rows[0].oldest).getTime();
    const retryAfter = Math.ceil((oldestTime + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

// 记录请求
async function recordRequest(userId: string): Promise<void> {
  const requestId = generateId('rate');
  await sql`
    INSERT INTO rate_limits (id, user_id, created_at)
    VALUES (${requestId}, ${userId}, CURRENT_TIMESTAMP)
  `;
}

// JSON 错误响应
function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({ success: false, error: { code, message, ...extra } }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

export default async function handler(req: Request): Promise<Response> {
  // 仅允许 POST
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 认证检查
  const userPayload = await getUserFromRequest(req);
  if (!userPayload) {
    return jsonError(401, 'UNAUTHORIZED', '请先登录');
  }

  // 限流检查
  const rateLimit = await checkRateLimit(userPayload.userId);
  if (!rateLimit.allowed) {
    return jsonError(429, 'RATE_LIMIT_EXCEEDED',
      `请求太频繁，请 ${rateLimit.retryAfter} 秒后再试`,
      { retryAfter: rateLimit.retryAfter },
    );
  }

  // 参数解析
  const body = await req.json().catch(() => ({}));
  const input = body.input || body;
  const { theme, childName, childAge, childGender, style } = input;

  if (!theme) {
    return jsonError(400, 'INVALID_PARAMS', '请提供故事主题');
  }

  // 初始化 SSE 流
  const sse = createSSE();

  // 记录请求（非阻塞）
  recordRequest(userPayload.userId).catch(err =>
    console.error('[故事流式生成] 记录请求失败:', err)
  );

  const startTime = Date.now();
  console.log('[故事流式生成-Edge] 开始, userId:', userPayload.userId, '主题:', theme);

  // 后台异步执行 AI 流式生成，Response 立即返回给客户端
  (async () => {
    try {
      const userPrompt = buildStoryUserPrompt({ theme, childName, childAge, childGender, style });
      const model = process.env.AI_MODEL || process.env.CLAUDE_MODEL || 'glm-4-flash';
      const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
      const baseURL = process.env.AI_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/';

      console.log('[故事流式生成-Edge] 使用模型:', model);

      // Edge Runtime 使用 fetch 调用 OpenAI 兼容 API（不依赖 Node.js SDK）
      const aiResponse = await fetch(`${baseURL}chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'StoryBook/1.0',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          temperature: 0.8,
          stream: true,
          messages: [
            { role: 'system', content: STORY_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text().catch(() => '');
        console.error('[故事流式生成-Edge] AI API 错误:', aiResponse.status, errText);
        if (aiResponse.status === 429) {
          sse.sendError('RATE_LIMIT', 'AI 服务请求过于频繁，请稍后再试');
        } else if (aiResponse.status === 401 || aiResponse.status === 403) {
          sse.sendError('AUTH_ERROR', 'AI 服务认证失败');
        } else {
          sse.sendError('AI_ERROR', 'AI 服务暂时不可用');
        }
        return;
      }

      // 解析 AI 返回的 SSE 流
      const reader = aiResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullContent += delta;
              sse.sendContent(delta);
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }

      const aiEndTime = Date.now();
      console.log('[故事流式生成-Edge] AI 流完成! 耗时:', (aiEndTime - startTime) / 1000, '秒, 内容长度:', fullContent.length);

      // 保存到数据库
      try {
        const { storyId, workId, title } = await saveStoryToDb({
          userId: userPayload.userId,
          storyContent: fullContent,
          theme,
          childName,
          childAge,
          childGender,
          style,
        });

        const doneData: StoryDoneData = {
          storyId,
          workId,
          title,
          content: fullContent,
          wordCount: fullContent.length,
          estimatedPages: Math.ceil(fullContent.length / 100),
          aiProvider: 'claude',
          aiModel: model,
        };

        sse.sendDone(doneData);

        console.log('[故事流式生成-Edge] 完成! storyId:', storyId, 'workId:', workId,
          '总耗时:', (Date.now() - startTime) / 1000, '秒');
      } catch (dbErr) {
        console.error('[故事流式生成-Edge] 数据库保存失败:', dbErr);
        sse.sendError('DB_SAVE_ERROR', '故事已生成但保存失败，请重新生成');
      }
    } catch (error: any) {
      console.error('[故事流式生成-Edge] 错误:', error?.message || error);

      let errorMessage = 'AI 服务暂时不可用';
      let errorCode = 'AI_ERROR';

      if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
        errorMessage = 'AI 服务连接超时，请稍后再试';
        errorCode = 'TIMEOUT';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      sse.sendError(errorCode, errorMessage);
    }
  })();

  // 立即返回 SSE Response，后台异步推送数据
  return sse.response;
}
