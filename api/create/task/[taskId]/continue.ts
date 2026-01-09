/**
 * 继续生成下一张图片接口
 * POST /api/create/task/[taskId]/continue
 *
 * 由于 Vercel 有 10 秒超时限制，批量图片生成需要前端轮询触发
 * 每次调用生成一张图片
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  success,
  error,
  errors,
  getUserFromRequest,
  generateImage,
  enhancePromptForChildrenBook,
  sql,
} from '../../_lib';

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

  // 获取任务 ID
  const { taskId } = req.query;
  if (!taskId || typeof taskId !== 'string') {
    return errors.invalidParams(res, '缺少任务 ID');
  }

  try {
    // 查询任务
    const taskResult = await sql`
      SELECT id, user_id, type, status, progress, total_items, completed_items, result
      FROM tasks
      WHERE id = ${taskId}
    `;

    if (taskResult.rows.length === 0) {
      return error(res, 'TASK_NOT_FOUND', '任务不存在', 404);
    }

    const task = taskResult.rows[0];

    // 验证权限
    if (task.user_id !== user.userId) {
      return errors.permissionDenied(res);
    }

    // 检查任务状态
    if (task.status === 'completed') {
      return success(res, {
        taskId: task.id,
        status: 'completed',
        message: '任务已完成',
      });
    }

    if (task.status === 'failed') {
      return error(res, 'TASK_FAILED', '任务已失败', 400);
    }

    // 解析任务结果
    const taskData = task.result as {
      storyboardId: string;
      style: string;
      pages: Array<{ pageNumber: number; imageUrl: string }>;
    };

    // 获取下一个需要生成的页面
    const nextPageNumber = task.completed_items + 1;

    const pageResult = await sql`
      SELECT id, page_number, image_prompt, image_url
      FROM storyboard_pages
      WHERE storyboard_id = ${taskData.storyboardId}
        AND page_number = ${nextPageNumber}
    `;

    if (pageResult.rows.length === 0) {
      // 没有更多页面，标记任务完成
      await sql`
        UPDATE tasks
        SET status = 'completed', progress = 100, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
      `;

      return success(res, {
        taskId: task.id,
        status: 'completed',
        message: '所有图片生成完成',
      });
    }

    const page = pageResult.rows[0];

    // 如果页面已有图片，跳过
    if (page.image_url) {
      // 更新进度
      const newCompleted = task.completed_items + 1;
      const newProgress = Math.round((newCompleted / task.total_items) * 100);
      const isCompleted = newCompleted >= task.total_items;

      await sql`
        UPDATE tasks
        SET completed_items = ${newCompleted},
            progress = ${newProgress},
            status = ${isCompleted ? 'completed' : 'processing'},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
      `;

      return success(res, {
        taskId: task.id,
        status: isCompleted ? 'completed' : 'processing',
        pageNumber: nextPageNumber,
        imageUrl: page.image_url,
        skipped: true,
        progress: newProgress,
      });
    }

    // 生成图片
    const enhancedPrompt = enhancePromptForChildrenBook(
      page.image_prompt,
      taskData.style
    );

    const result = await generateImage({
      prompt: enhancedPrompt,
      size: '1024x1024',
    });

    // 更新页面图片
    await sql`
      UPDATE storyboard_pages
      SET image_url = ${result.imageUrl}
      WHERE id = ${page.id}
    `;

    // 更新任务进度
    const newCompleted = task.completed_items + 1;
    const newProgress = Math.round((newCompleted / task.total_items) * 100);
    const isCompleted = newCompleted >= task.total_items;

    // 更新任务结果
    taskData.pages.push({
      pageNumber: nextPageNumber,
      imageUrl: result.imageUrl,
    });

    await sql`
      UPDATE tasks
      SET completed_items = ${newCompleted},
          progress = ${newProgress},
          status = ${isCompleted ? 'completed' : 'processing'},
          result = ${JSON.stringify(taskData)},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
    `;

    return success(res, {
      taskId: task.id,
      status: isCompleted ? 'completed' : 'processing',
      pageNumber: nextPageNumber,
      imageUrl: result.imageUrl,
      progress: newProgress,
      completedItems: newCompleted,
      totalItems: task.total_items,
    });
  } catch (err) {
    console.error('继续生成图片失败:', err);

    // 更新任务状态为失败
    await sql`
      UPDATE tasks
      SET status = 'failed', error = ${String(err)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
    `;

    return errors.aiServiceError(res, '图片生成失败');
  }
}
