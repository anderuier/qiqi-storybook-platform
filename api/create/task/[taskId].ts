/**
 * 查询异步任务状态接口
 * GET /api/create/task/[taskId]
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  success,
  error,
  errors,
  getUserFromRequest,
  sql,
} from '../../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 GET 方法
  if (req.method !== 'GET') {
    return errors.methodNotAllowed(res, ['GET']);
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
      SELECT id, user_id, type, status, progress, total_items, completed_items, result, error, created_at, updated_at
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

    return success(res, {
      taskId: task.id,
      type: task.type,
      status: task.status,
      progress: task.progress,
      totalItems: task.total_items,
      completedItems: task.completed_items,
      result: task.result,
      error: task.error,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    });
  } catch (err) {
    console.error('查询任务失败:', err);
    return errors.serverError(res, '查询任务失败');
  }
}
