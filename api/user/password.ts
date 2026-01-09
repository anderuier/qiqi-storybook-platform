/**
 * 修改密码接口
 * PUT /api/user/password
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  success,
  error,
  errors,
  getUserFromRequest,
  validateBody,
  schemas,
  sql,
  hashPassword,
  verifyPassword,
} from '../_lib';

// 请求体验证 Schema
const changePasswordSchema = z.object({
  oldPassword: schemas.password,
  newPassword: schemas.password,
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
  const body = validateBody(req, res, changePasswordSchema);
  if (!body) return;

  const { oldPassword, newPassword } = body;

  // 新旧密码不能相同
  if (oldPassword === newPassword) {
    return errors.invalidParams(res, '新密码不能与旧密码相同');
  }

  try {
    // 获取当前密码哈希
    const result = await sql`
      SELECT password_hash FROM users WHERE id = ${user.userId}
    `;

    if (result.rows.length === 0) {
      return errors.notFound(res, '用户');
    }

    const currentHash = result.rows[0].password_hash;

    // 验证旧密码
    const isValid = await verifyPassword(oldPassword, currentHash);
    if (!isValid) {
      return error(res, 'PASSWORD_WRONG', '当前密码错误', 400);
    }

    // 加密新密码并更新
    const newHash = await hashPassword(newPassword);
    await sql`
      UPDATE users
      SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.userId}
    `;

    return success(res, {
      message: '密码修改成功',
    });
  } catch (err) {
    console.error('修改密码失败:', err);
    return errors.serverError(res, '修改密码失败');
  }
}
