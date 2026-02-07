/**
 * 分镜流式生成处理器
 * POST /api/create/storyboard/stream
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type OpenAI from 'openai';
import { sql } from '@vercel/postgres';
import {
  STORYBOARD_SYSTEM_PROMPT,
  buildStoryboardUserPrompt,
} from '../../_lib/prompts.config.js';
import { initSSE, sendContentDelta, sendDone, sendError } from '../../_lib/sse.js';
import { parseStoryboardText } from './parser.js';
import { saveStoryboardToDb } from './db-save.js';
import type { StoryboardDoneData } from '../../_lib/sse.types.js';

// 类型定义
interface UserPayload {
  userId: string;
  email: string;
  nickname: string;
}

/**
 * 分镜流式生成处理器
 */
export async function handleStoryboardStream(
  req: VercelRequest,
  res: VercelResponse,
  dependencies: {
    getUserFromRequest: (req: VercelRequest) => Promise<UserPayload | null>;
    checkRateLimit: (userId: string) => Promise<{ allowed: boolean; retryAfter?: number }>;
    recordRequest: (userId: string) => Promise<void>;
    getAIClient: () => OpenAI;
  }
): Promise<void> {
  const { getUserFromRequest, checkRateLimit, recordRequest, getAIClient } = dependencies;

  // 认证检查（SSE 之前，用 JSON 返回）
  const userPayload = await getUserFromRequest(req);
  if (!userPayload) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '请先登录' },
    });
    return;
  }

  // 限流检查
  const rateLimit = await checkRateLimit(userPayload.userId);
  if (!rateLimit.allowed) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `请求太频繁，请 ${rateLimit.retryAfter} 秒后再试`,
        retryAfter: rateLimit.retryAfter,
      },
    });
    return;
  }

  // 参数解析
  const body = req.body || {};
  const { storyContent, pageCount = 6, workId } = body;

  if (!storyContent) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: '请提供故事内容' },
    });
    return;
  }

  if (!workId) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: '请提供作品ID' },
    });
    return;
  }

  // 验证页数范围（4-12页）
  const validPageCount = Math.min(Math.max(parseInt(pageCount) || 6, 4), 12);

  if (validPageCount !== parseInt(pageCount)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAGE_COUNT', message: '页数必须在 4-12 页之间' },
    });
    return;
  }

  // 验证 work 存在且属于当前用户
  const workResult = await sql`
    SELECT id, user_id FROM works WHERE id = ${workId} AND user_id = ${userPayload.userId}
  `;
  if (workResult.rows.length === 0) {
    res.status(404).json({
      success: false,
      error: { code: 'WORK_NOT_FOUND', message: '作品不存在' },
    });
    return;
  }

  // 获取关联的 story_id
  const storyResult = await sql`
    SELECT id FROM stories WHERE work_id = ${workId} LIMIT 1
  `;
  const storyId = storyResult.rows[0]?.id || null;

  // 先初始化 SSE 响应，让客户端尽快收到响应头
  initSSE(res);

  // 记录请求（非阻塞关键路径，移到 SSE 初始化之后）
  recordRequest(userPayload.userId).catch(err =>
    console.error('[分镜流式生成] 记录请求失败:', err)
  );

  const startTime = Date.now();
  console.log('[分镜流式生成] 开始 workId:', workId, '页数:', validPageCount);

  try {
    const client = getAIClient();
    const userPrompt = buildStoryboardUserPrompt(storyContent, validPageCount);
    const storyboardModel = process.env.STORYBOARD_MODEL || 'GLM-4.7-FlashX';

    console.log('[分镜流式生成] 使用模型:', storyboardModel);

    // 流式调用 AI API
    const stream = await client.chat.completions.create({
      model: storyboardModel,
      max_tokens: 4000,
      temperature: 0.7,
      stream: true,
      messages: [
        { role: 'system', content: STORYBOARD_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    let fullContent = '';

    // 逐 chunk 转发
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        sendContentDelta(res, delta);
      }
    }

    const aiEndTime = Date.now();
    console.log('[分镜流式生成] AI 流完成! 耗时:', (aiEndTime - startTime) / 1000, '秒, 内容长度:', fullContent.length);

    // 解析分镜文本
    const pages = parseStoryboardText(fullContent);

    console.log('[分镜流式生成] 解析结果:', pages.length, '页');

    if (pages.length === 0) {
      console.error('[分镜流式生成] 解析失败，原始内容:', fullContent.substring(0, 500));
      sendError(res, 'PARSE_ERROR', '分镜数据解析失败，请重试');
      return;
    }

    if (pages.length < validPageCount) {
      console.warn('[分镜流式生成] 页数不足，期望:', validPageCount, '实际:', pages.length);
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

      sendDone(res, doneData);

      const totalTime = Date.now();
      console.log('[分镜流式生成] 完成! storyboardId:', storyboardId, '总耗时:', (totalTime - startTime) / 1000, '秒');
    } catch (dbErr) {
      console.error('[分镜流式生成] 数据库保存失败:', dbErr);
      sendError(res, 'DB_SAVE_ERROR', '分镜已生成但保存失败，请重新生成');
    }
  } catch (error: any) {
    console.error('[分镜流式生成] 错误:', error?.message || error);

    let errorMessage = 'AI 服务暂时不可用';
    let errorCode = 'AI_ERROR';

    if (error?.status === 429) {
      errorMessage = 'AI 服务请求过于频繁，请稍后再试';
      errorCode = 'RATE_LIMIT';
    } else if (error?.status === 401 || error?.status === 403) {
      errorMessage = 'AI 服务认证失败';
      errorCode = 'AUTH_ERROR';
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
      errorMessage = 'AI 服务连接超时，请稍后再试';
      errorCode = 'TIMEOUT';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (res.headersSent) {
      sendError(res, errorCode, errorMessage);
    } else {
      res.status(500).json({
        success: false,
        error: { code: errorCode, message: errorMessage },
      });
    }
  }
}
