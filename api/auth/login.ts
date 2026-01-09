/**
 * 用户登录接口
 * POST /api/auth/login
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  success,
  error,
  errors,
  validateBody,
  schemas,
  generateToken,
  sql,
  verifyPassword,
} from '../_lib';

// 请求体验证 Schema
const loginSchema = z.object({
  email: schemas.email,
  password: schemas.password,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return errors.methodNotAllowed(res, ['POST']);
  }

  // 验证请求参数
  const body = validateBody(req, res, loginSchema);
  if (!body) return;

  const { email, password } = body;

  try {
    // 查询用户
    const result = await sql`
      SELECT id, email, password_hash, nickname, avatar
      FROM users
      WHERE email = ${email}
    `;

    if (result.rows.length === 0) {
      return error(res, 'EMAIL_NOT_FOUND', '该邮箱未注册', 400);
    }

    const user = result.rows[0];

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return error(res, 'PASSWORD_WRONG', '密码错误', 400);
    }

    // 生成 JWT Token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    return success(res, {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      token,
    });
  } catch (err) {
    console.error('登录失败:', err);
    return errors.serverError(res, '登录失败，请稍后重试');
  }
}
