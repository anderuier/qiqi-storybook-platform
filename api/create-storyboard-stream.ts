/**
 * 分镜流式生成 - Edge Function
 * POST /api/create/storyboard/stream
 * 通过 Vercel rewrite 从 /api/create/storyboard/stream 映射到此文件
 */

export const config = { runtime: 'edge' };

import { getUserFromRequest } from './_edge/auth.js';
import { createSSE } from './_edge/sse.js';
import { sql } from '@vercel/postgres';
import {
  STORYBOARD_SYSTEM_PROMPT,
  buildStoryboardUserPrompt,
} from './_lib/prompts.config.js';
import { parseStoryboardText } from './modules/_storyboard/parser.js';
import { saveStoryboardToDb } from './modules/_storyboard/db-save.js';
import type { StoryboardDoneData } from './_lib/sse.types.js';

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
    { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
  );
}

export default async function handler(req: Request): Promise<Response> {
  // CORS 预检
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
  const { storyContent, pageCount = 6, workId } = body;

  if (!storyContent) {
    return jsonError(400, 'INVALID_PARAMS', '请提供故事内容');
  }

  if (!workId) {
    return jsonError(400, 'INVALID_PARAMS', '请提供作品ID');
  }

  // 验证页数范围（4-12页）
  const validPageCount = Math.min(Math.max(parseInt(pageCount) || 6, 4), 12);
  if (validPageCount !== parseInt(pageCount)) {
    return jsonError(400, 'INVALID_PAGE_COUNT', '页数必须在 4-12 页之间');
  }

  // 验证 work 存在且属于当前用户
  const workResult = await sql`
    SELECT id, user_id FROM works WHERE id = ${workId} AND user_id = ${userPayload.userId}
  `;
  if (workResult.rows.length === 0) {
    return jsonError(404, 'WORK_NOT_FOUND', '作品不存在');
  }

  // 获取关联的 story_id
  const storyResult = await sql`
    SELECT id FROM stories WHERE work_id = ${workId} LIMIT 1
  `;
  const storyId = storyResult.rows[0]?.id || null;

  // 初始化 SSE 流
  const sse = createSSE();

  // 记录请求（非阻塞）
  recordRequest(userPayload.userId).catch(err =>
    console.error('[分镜流式生成] 记录请求失败:', err)
  );

  const startTime = Date.now();
  console.log('[分镜流式生成-Edge] 开始 workId:', workId, '页数:', validPageCount);

  // 后台异步执行 AI 流式生成，Response 立即返回给客户端
  (async () => {
    try {
      const userPrompt = buildStoryboardUserPrompt(storyContent, validPageCount);
      const storyboardModel = process.env.STORYBOARD_MODEL || 'GLM-4.7-FlashX';
      const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
      const baseURL = process.env.AI_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/';

      console.log('[分镜流式生成-Edge] 使用模型:', storyboardModel);

      // Edge Runtime 使用 fetch 调用 OpenAI 兼容 API
      const aiResponse = await fetch(`${baseURL}chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'StoryBook/1.0',
        },
        body: JSON.stringify({
          model: storyboardModel,
          max_tokens: 4000,
          temperature: 0.7,
          stream: true,
          messages: [
            { role: 'system', content: STORYBOARD_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text().catch(() => '');
        console.error('[分镜流式生成-Edge] AI API 错误:', aiResponse.status, errText);
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
      console.log('[分镜流式生成-Edge] AI 流完成! 耗时:', (aiEndTime - startTime) / 1000, '秒, 内容长度:', fullContent.length);

      // 解析分镜文本
      const pages = parseStoryboardText(fullContent);
      console.log('[分镜流式生成-Edge] 解析结果:', pages.length, '页');

      if (pages.length === 0) {
        console.error('[分镜流式生成-Edge] 解析失败，原始内容:', fullContent.substring(0, 500));
        sse.sendError('PARSE_ERROR', '分镜数据解析失败，请重试');
        return;
      }

      if (pages.length < validPageCount) {
        console.warn('[分镜流式生成-Edge] 页数不足，期望:', validPageCount, '实际:', pages.length);
      }

      // 保存到数据库
      try {
        const { storyboardId } = await saveStoryboardToDb({
          workId,
          storyId,
          pages,
        });

        const doneData: StoryboardDoneData = {
          storyboardId,
          pageCount: pages.length,
          pages,
          aiProvider: 'claude',
          aiModel: storyboardModel,
        };

        sse.sendDone(doneData);

        console.log('[分镜流式生成-Edge] 完成! storyboardId:', storyboardId,
          '总耗时:', (Date.now() - startTime) / 1000, '秒');
      } catch (dbErr) {
        console.error('[分镜流式生成-Edge] 数据库保存失败:', dbErr);
        sse.sendError('DB_SAVE_ERROR', '分镜已生成但保存失败，请重新生成');
      }
    } catch (error: any) {
      console.error('[分镜流式生成-Edge] 错误:', error?.message || error);

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
