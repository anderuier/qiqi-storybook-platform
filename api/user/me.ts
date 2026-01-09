/**
 * 获取当前用户信息接口
 * GET /api/user/me
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { success, errors, getUserFromRequest, sql } from '../_lib';

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

  try {
    // 从数据库获取完整用户信息
    const result = await sql`
      SELECT id, email, nickname, avatar, created_at
      FROM users
      WHERE id = ${user.userId}
    `;

    if (result.rows.length === 0) {
      return errors.notFound(res, '用户');
    }

    const dbUser = result.rows[0];

    // 获取用户作品统计
    const statsResult = await sql`
      SELECT
        COUNT(*) as works_count,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count
      FROM works
      WHERE user_id = ${user.userId}
    `;

    const stats = statsResult.rows[0];

    return success(res, {
      userId: dbUser.id,
      email: dbUser.email,
      nickname: dbUser.nickname,
      avatar: dbUser.avatar,
      createdAt: dbUser.created_at,
      stats: {
        worksCount: parseInt(stats.works_count) || 0,
        publishedCount: parseInt(stats.published_count) || 0,
      },
    });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return errors.serverError(res, '获取用户信息失败');
  }
}
