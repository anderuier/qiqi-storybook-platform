/**
 * 生成分镜剧本接口
 * POST /api/create/storyboard
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  success,
  error,
  errors,
  getUserFromRequest,
  validateBody,
  generateText,
  getStoryboardSystemPrompt,
  getStoryboardUserPrompt,
  sql,
  generateId,
} from '../_lib';

// 请求体验证 Schema
const createStoryboardSchema = z.object({
  storyId: z.string().min(1),
  pageCount: z.number().int().min(4).max(15).optional(),
});

// 分镜页面接口
interface StoryboardPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  duration: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return errors.methodNotAllowed(res, ['POST']);
  }

  // 验证用户登录状态
  const user = await getUserFromRequest(req);
  if (!user) {
    return errors.authRequired(res);
  }

  // 验证请求参数
  const body = validateBody(req, res, createStoryboardSchema);
  if (!body) return;

  const { storyId, pageCount } = body;

  try {
    // 获取故事内容
    const storyResult = await sql`
      SELECT s.id, s.content, s.work_id, w.user_id
      FROM stories s
      JOIN works w ON s.work_id = w.id
      WHERE s.id = ${storyId}
    `;

    if (storyResult.rows.length === 0) {
      return error(res, 'STORY_NOT_FOUND', '故事不存在', 404);
    }

    const story = storyResult.rows[0];

    // 验证权限
    if (story.user_id !== user.userId) {
      return errors.permissionDenied(res);
    }

    // 生成分镜剧本
    const result = await generateText({
      messages: [
        { role: 'system', content: getStoryboardSystemPrompt() },
        { role: 'user', content: getStoryboardUserPrompt(story.content, pageCount) },
      ],
      maxTokens: 3000,
      temperature: 0.5,
    });

    // 解析 JSON 响应
    let parsedResult: { pages: StoryboardPage[] };
    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析分镜剧本');
      }
      parsedResult = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('JSON 解析失败:', parseErr);
      return errors.aiServiceError(res, '分镜剧本生成格式错误，请重试');
    }

    // 验证并处理分镜数据
    const pages: StoryboardPage[] = parsedResult.pages.map((page, index) => ({
      pageNumber: page.pageNumber || index + 1,
      text: page.text,
      imagePrompt: page.imagePrompt,
      duration: estimateDuration(page.text),
    }));

    // 创建分镜记录
    const storyboardId = generateId('sb');

    await sql`
      INSERT INTO storyboards (id, work_id, story_id)
      VALUES (${storyboardId}, ${story.work_id}, ${storyId})
    `;

    // 插入分镜页面
    for (const page of pages) {
      const pageId = generateId('page');
      await sql`
        INSERT INTO storyboard_pages (id, storyboard_id, page_number, text, image_prompt, duration)
        VALUES (${pageId}, ${storyboardId}, ${page.pageNumber}, ${page.text}, ${page.imagePrompt}, ${page.duration})
      `;
    }

    // 更新作品页数
    await sql`
      UPDATE works SET page_count = ${pages.length}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${story.work_id}
    `;

    return success(res, {
      storyboardId,
      workId: story.work_id,
      pageCount: pages.length,
      pages,
      aiProvider: result.provider,
      aiModel: result.model,
    });
  } catch (err) {
    console.error('分镜剧本生成失败:', err);
    return errors.aiServiceError(res, '分镜剧本生成失败，请稍后重试');
  }
}

// 估算朗读时长（秒）
function estimateDuration(text: string): number {
  // 中文朗读速度约 3-4 字/秒，儿童绘本朗读较慢
  const charsPerSecond = 3;
  return Math.ceil(text.length / charsPerSecond);
}
