/**
 * 用户注册接口
 * POST /api/auth/register
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
  generateId,
  hashPassword,
} from '../_lib';

// 请求体验证 Schema
const registerSchema = z.object({
  email: schemas.email,
  password: schemas.password,
  nickname: schemas.nickname,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return errors.methodNotAllowed(res, ['POST']);
  }

  // 验证请求参数
  const body = validateBody(req, res, registerSchema);
  if (!body) return;

  const { email, password, nickname } = body;

  try {
    // 检查邮箱是否已注册
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return error(res, 'EMAIL_EXISTS', '该邮箱已被注册', 400);
    }

    // 生成用户 ID 和加密密码
    const userId = generateId('user');
    const passwordHash = await hashPassword(password);

    // 插入新用户
    await sql`
      INSERT INTO users (id, email, password_hash, nickname)
      VALUES (${userId}, ${email}, ${passwordHash}, ${nickname})
    `;

    // 生成 JWT Token
    const token = await generateToken({ userId, email, nickname });

    return success(
      res,
      {
        userId,
        email,
        nickname,
        token,
      },
      201
    );
  } catch (err) {
    console.error('注册失败:', err);
    return errors.serverError(res, '注册失败，请稍后重试');
  }
}
