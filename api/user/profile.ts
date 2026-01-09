/**
 * 更新用户信息接口
 * PUT /api/user/profile
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  success,
  errors,
  getUserFromRequest,
  validateBody,
  sql,
} from '../_lib';

// 请求体验证 Schema
const updateProfileSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  avatar: z.string().url().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 PUT 方法
  if (req.method !== 'PUT') {
    return errors.methodNotAllowed(res, ['PUT']);
  }

  // 验证用户登录状态
  const user = await getUserFromRequest(req);
  if (!user) {
    return errors.authRequired(res);
  }

  // 验证请求参数
  const body = validateBody(req, res, updateProfileSchema);
  if (!body) return;

  const { nickname, avatar } = body;

  // 至少需要更新一个字段
  if (!nickname && !avatar) {
    return errors.invalidParams(res, '请提供要更新的字段');
  }

  try {
    // 构建更新语句
    let result;
    if (nickname && avatar) {
      result = await sql`
        UPDATE users
        SET nickname = ${nickname}, avatar = ${avatar}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.userId}
        RETURNING id, nickname, avatar
      `;
    } else if (nickname) {
      result = await sql`
        UPDATE users
        SET nickname = ${nickname}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.userId}
        RETURNING id, nickname, avatar
      `;
    } else {
      result = await sql`
        UPDATE users
        SET avatar = ${avatar}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.userId}
        RETURNING id, nickname, avatar
      `;
    }

    if (result.rows.length === 0) {
      return errors.notFound(res, '用户');
    }

    const updatedUser = result.rows[0];

    return success(res, {
      userId: updatedUser.id,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
    });
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return errors.serverError(res, '更新用户信息失败');
  }
}
