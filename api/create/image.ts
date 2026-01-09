/**
 * 生成单张分镜图片接口
 * POST /api/create/image
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
const createImageSchema = z.object({
  storyboardId: z.string().min(1),
  pageNumber: z.number().int().min(1),
  style: z.enum(['watercolor', 'cartoon', 'oil', 'anime', 'flat', '3d']),
  regenerate: z.boolean().optional().default(false),
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
  const body = validateBody(req, res, createImageSchema);
  if (!body) return;

  const { storyboardId, pageNumber, style, regenerate } = body;

  try {
    // 获取分镜页面信息
    const pageResult = await sql`
      SELECT sp.id, sp.image_prompt, sp.image_url, sb.work_id, w.user_id
      FROM storyboard_pages sp
      JOIN storyboards sb ON sp.storyboard_id = sb.id
      JOIN works w ON sb.work_id = w.id
      WHERE sp.storyboard_id = ${storyboardId}
        AND sp.page_number = ${pageNumber}
    `;

    if (pageResult.rows.length === 0) {
      return error(res, 'PAGE_NOT_FOUND', '分镜页面不存在', 404);
    }

    const page = pageResult.rows[0];

    // 验证权限
    if (page.user_id !== user.userId) {
      return errors.permissionDenied(res);
    }

    // 如果已有图片且不是重新生成，直接返回
    if (page.image_url && !regenerate) {
      return success(res, {
        imageId: page.id,
        imageUrl: page.image_url,
        pageNumber,
        style,
        isExisting: true,
      });
    }

    // 增强 prompt
    const enhancedPrompt = enhancePromptForChildrenBook(page.image_prompt, style);

    // 生成图片
    const result = await generateImage({
      prompt: enhancedPrompt,
      size: '1024x1024',
      style: 'vivid',
      quality: 'standard',
    });

    // 更新数据库
    await sql`
      UPDATE storyboard_pages
      SET image_url = ${result.imageUrl}
      WHERE id = ${page.id}
    `;

    return success(res, {
      imageId: page.id,
      imageUrl: result.imageUrl,
      pageNumber,
      style,
      revisedPrompt: result.revisedPrompt,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    console.error('图片生成失败:', err);
    return errors.aiServiceError(res, '图片生成失败，请稍后重试');
  }
}
