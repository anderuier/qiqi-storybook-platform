/**
 * 分镜生成模块
 * POST /api/create/storyboard
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';
import {
  STORYBOARD_SYSTEM_PROMPT,
  STORYBOARD_PAGE_SEPARATOR_REGEX,
  STORYBOARD_LOOSE_SEPARATOR_REGEX,
  STORYBOARD_TEXT_REGEX,
  STORYBOARD_IMAGE_REGEX,
  buildStoryboardUserPrompt,
} from '../_lib/prompts.config.js';

// 类型定义
interface UserPayload {
  userId: string;
  email: string;
  nickname: string;
}

interface StoryboardPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
}

// 解析分镜文本为结构化数据
function parseStoryboardText(text: string): StoryboardPage[] {
  const pages: StoryboardPage[] = [];

  // 更健壮的分隔符匹配：支持各种变体格式
  const sections = text.split(STORYBOARD_PAGE_SEPARATOR_REGEX).filter(s => s.trim());

  // 如果上面的分割没有结果，尝试更宽松的匹配
  if (sections.length === 0) {
    const looseSections = text.split(STORYBOARD_LOOSE_SEPARATOR_REGEX).filter(s => s.trim() && isNaN(Number(s)));
    if (looseSections.length > 0) {
      sections.push(...looseSections);
    }
  }

  sections.forEach((section, index) => {
    const textMatch = section.match(STORYBOARD_TEXT_REGEX);
    const imageMatch = section.match(STORYBOARD_IMAGE_REGEX);

    if (textMatch || imageMatch) {
      pages.push({
        pageNumber: index + 1,
        text: textMatch ? textMatch[1].trim() : '',
        imagePrompt: imageMatch ? imageMatch[1].trim() : '',
      });
    }
  });

  return pages;
}

function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${randomStr}`;
}

/**
 * 注册分镜生成路由
 */
export function registerStoryboardRoutes(
  app: any,
  dependencies: {
    getUserFromRequest: (req: VercelRequest) => Promise<UserPayload | null>;
    checkRateLimit: (userId: string) => Promise<{ allowed: boolean; retryAfter?: number }>;
    recordRequest: (userId: string) => Promise<void>;
    getAIClient: () => OpenAI;
  }
) {
  const { getUserFromRequest, checkRateLimit, recordRequest, getAIClient } = dependencies;

  app.post('/api/create/storyboard', async (req: VercelRequest, res: VercelResponse) => {
    const userPayload = await getUserFromRequest(req);

    if (!userPayload) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '请先登录',
        },
      });
    }

    // 检查限流
    const rateLimit = await checkRateLimit(userPayload.userId);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `请求太频繁，请 ${rateLimit.retryAfter} 秒后再试`,
          retryAfter: rateLimit.retryAfter,
        },
      });
    }

    const body = req.body || {};
    const { storyContent, pageCount = 6, workId } = body;

    if (!storyContent) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '请提供故事内容',
        },
      });
    }

    if (!workId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '请提供作品ID',
        },
      });
    }

    // 验证页数范围（4-12页）
    const validPageCount = Math.min(Math.max(parseInt(pageCount) || 6, 4), 12);

    if (validPageCount !== parseInt(pageCount)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGE_COUNT',
          message: '页数必须在 4-12 页之间',
        },
      });
    }

    // 验证 work 存在且属于当前用户
    const workResult = await sql`
      SELECT id, user_id FROM works WHERE id = ${workId} AND user_id = ${userPayload.userId}
    `;
    if (workResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORK_NOT_FOUND',
          message: '作品不存在',
        },
      });
    }

    // 获取关联的 story_id
    const storyResult = await sql`
      SELECT id FROM stories WHERE work_id = ${workId} LIMIT 1
    `;
    const storyId = storyResult.rows[0]?.id || null;

    // 记录请求
    await recordRequest(userPayload.userId);

    // 分镜生成日志
    const startTime = Date.now();
    console.log('[分镜生成] 开始 workId:', workId, '页数:', validPageCount);

    try {
      const client = getAIClient();

      const userPrompt = buildStoryboardUserPrompt(storyContent, validPageCount);

      console.log('[分镜生成] 准备调用 AI API, 时间:', new Date().toISOString());

      // 使用 FlashX 模型加速分镜生成（避免 Vercel 60秒超时）
      const storyboardModel = process.env.STORYBOARD_MODEL || 'GLM-4.7-FlashX';

      console.log('[分镜生成] 使用模型:', storyboardModel);
      console.log('[分镜生成] 发送 Prompt (System):', STORYBOARD_SYSTEM_PROMPT);
      console.log('[分镜生成] 发送 Prompt (User):', userPrompt);

      const response = await client.chat.completions.create({
        model: storyboardModel,
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: STORYBOARD_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const aiEndTime = Date.now();
      console.log('[分镜生成] AI API 调用成功! 耗时:', (aiEndTime - startTime) / 1000, '秒');

      const content = response.choices[0]?.message?.content || '';

      console.log('[分镜生成] AI 返回内容长度:', content.length, '字符');
      console.log('[分镜生成] AI 返回全文:', content);

      // 解析分镜文本
      const pages = parseStoryboardText(content);

      console.log('[分镜生成] 解析结果:', pages.length, '页');

      if (pages.length === 0) {
        console.error('[分镜生成] 解析失败，原始内容:', content.substring(0, 500));
        return res.status(500).json({
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: '分镜数据解析失败，请重试',
            rawContent: content.substring(0, 1000),
          },
        });
      }

      // 检查是否内容被截断（页数不足）
      if (pages.length < validPageCount) {
        console.warn('[分镜生成] 页数不足，期望:', validPageCount, '实际:', pages.length);
      }

      // 生成分镜 ID
      const storyboardId = generateId('sb');

      console.log('[分镜生成] 开始保存到数据库...');

      const dbStartTime = Date.now();

      // 保存到数据库：创建 storyboard 记录
      await sql`
        INSERT INTO storyboards (id, work_id, story_id)
        VALUES (${storyboardId}, ${workId}, ${storyId})
      `;

      // 保存分镜页面
      for (const page of pages) {
        const pageId = generateId('page');
        await sql`
          INSERT INTO storyboard_pages (id, storyboard_id, page_number, text, image_prompt)
          VALUES (${pageId}, ${storyboardId}, ${page.pageNumber}, ${page.text}, ${page.imagePrompt})
        `;
      }

      // 更新 work 的当前步骤和页数
      await sql`
        UPDATE works
        SET current_step = 'storyboard', page_count = ${pages.length}, updated_at = NOW()
        WHERE id = ${workId}
      `;

      const dbEndTime = Date.now();
      console.log('[分镜生成] 数据库保存完成! 耗时:', (dbEndTime - dbStartTime) / 1000, '秒');

      const totalEndTime = Date.now();
      console.log('[分镜生成] 完成! 总耗时:', (totalEndTime - startTime) / 1000, '秒');

      return res.status(200).json({
        success: true,
        data: {
          storyboardId,
          pageCount: pages.length,
          pages: pages,
          aiProvider: 'claude',
          aiModel: response.model || 'claude-haiku',
        },
      });
    } catch (error: any) {
      const errorTime = Date.now();
      console.error('[分镜生成] 错误! 已耗时:', (errorTime - startTime) / 1000, '秒');
      console.error('[分镜生成] 错误:', error?.message || error);

      // 判断错误类型
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

      return res.status(500).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
      });
    }
  });
}
