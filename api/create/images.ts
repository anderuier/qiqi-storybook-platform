/**
 * 批量生成分镜图片接口
 * POST /api/create/images
 *
 * 注意：由于 Vercel Serverless 有 10 秒超时限制，
 * 批量生成采用异步任务模式，返回任务 ID 供前端轮询
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  success,
  error,
  errors,
  getUserFromRequest,
  validateBody,
  generateImage,
  enhancePromptForChildrenBook,
  sql,
  generateId,
} from '../_lib';

// 请求体验证 Schema
const createImagesSchema = z.object({
  storyboardId: z.string().min(1),
  style: z.enum(['watercolor', 'cartoon', 'oil', 'anime', 'flat', '3d']),
});

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
  const body = validateBody(req, res, createImagesSchema);
  if (!body) return;

  const { storyboardId, style } = body;

  try {
    // 获取分镜信息和所有页面
    const storyboardResult = await sql`
      SELECT sb.id, sb.work_id, w.user_id
      FROM storyboards sb
      JOIN works w ON sb.work_id = w.id
      WHERE sb.id = ${storyboardId}
    `;

    if (storyboardResult.rows.length === 0) {
      return error(res, 'STORYBOARD_NOT_FOUND', '分镜不存在', 404);
    }

    const storyboard = storyboardResult.rows[0];

    // 验证权限
    if (storyboard.user_id !== user.userId) {
      return errors.permissionDenied(res);
    }

    // 获取所有页面
    const pagesResult = await sql`
      SELECT id, page_number, image_prompt, image_url
      FROM storyboard_pages
      WHERE storyboard_id = ${storyboardId}
      ORDER BY page_number
    `;

    const pages = pagesResult.rows;
    const totalPages = pages.length;

    if (totalPages === 0) {
      return error(res, 'NO_PAGES', '分镜没有页面', 400);
    }

    // 创建异步任务
    const taskId = generateId('task');
    await sql`
      INSERT INTO tasks (id, user_id, type, status, total_items, result)
      VALUES (
        ${taskId},
        ${user.userId},
        'generate_images',
        'processing',
        ${totalPages},
        ${JSON.stringify({ storyboardId, style, pages: [] })}
      )
    `;

    // 由于 Vercel 有超时限制，这里只生成第一张图片
    // 后续图片需要前端轮询触发或使用其他方案
    // 实际生产环境建议使用：
    // 1. Vercel Cron Jobs
    // 2. 外部队列服务（如 Upstash QStash）
    // 3. 前端逐张请求

    // 尝试生成第一张图片
    const firstPage = pages[0];
    if (!firstPage.image_url) {
      try {
        const enhancedPrompt = enhancePromptForChildrenBook(
          firstPage.image_prompt,
          style
        );
        const result = await generateImage({
          prompt: enhancedPrompt,
          size: '1024x1024',
        });

        // 更新页面图片
        await sql`
          UPDATE storyboard_pages
          SET image_url = ${result.imageUrl}
          WHERE id = ${firstPage.id}
        `;

        // 更新任务进度
        await sql`
          UPDATE tasks
          SET completed_items = 1,
              progress = ${Math.round((1 / totalPages) * 100)},
              result = ${JSON.stringify({
                storyboardId,
                style,
                pages: [{ pageNumber: 1, imageUrl: result.imageUrl }],
              })},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${taskId}
        `;
      } catch (imgErr) {
        console.error('第一张图片生成失败:', imgErr);
        // 不影响任务创建，���续返回任务 ID
      }
    }

    return success(res, {
      taskId,
      status: 'processing',
      totalPages,
      message: '图片生成任务已创建，请使用任务 ID 查询进度',
    });
  } catch (err) {
    console.error('批量图片生成失败:', err);
    return errors.serverError(res, '创建图片生成任务失败');
  }
}
