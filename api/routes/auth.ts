/**
 * 认证相关路由
 * /api/auth/*
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  success,
  errors,
  validateBody,
  schemas,
  getUserFromRequest,
  error,
} from '../_lib/hono-helpers';
import { generateToken } from '../_lib/auth';
import { sql, generateId } from '../_lib/db';
import { hashPassword, verifyPassword } from '../_lib/password';

const auth = new Hono();

// ============================================
// POST /auth/register - 用户注册
// ============================================
const registerSchema = z.object({
  email: schemas.email,
  password: schemas.password,
  nickname: schemas.nickname,
});

auth.post('/register', async (c) => {
  const validation = await validateBody(c, registerSchema);
  if ('error' in validation) {
    return errors.invalidParams(c, validation.error);
  }

  const { email, password, nickname } = validation.data;

  try {
    // 检查邮箱是否已注册
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return error(c, 'EMAIL_EXISTS', '该邮箱已被注册', 400);
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

    return success(c, { userId, email, nickname, token }, 201);
  } catch (err) {
    console.error('注册失败:', err);
    return errors.serverError(c, '注册失败，请稍后重试');
  }
});

// ============================================
// POST /auth/login - 用户登录
// ============================================
const loginSchema = z.object({
  email: schemas.email,
  password: schemas.password,
});

auth.post('/login', async (c) => {
  const validation = await validateBody(c, loginSchema);
  if ('error' in validation) {
    return errors.invalidParams(c, validation.error);
  }

  const { email, password } = validation.data;

  try {
    // 查询用户
    const result = await sql`
      SELECT id, email, password_hash, nickname, avatar
      FROM users
      WHERE email = ${email}
    `;

    if (result.rows.length === 0) {
      return error(c, 'EMAIL_NOT_FOUND', '该邮箱未注册', 400);
    }

    const user = result.rows[0];

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return error(c, 'PASSWORD_WRONG', '密码错误', 400);
    }

    // 生成 JWT Token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    return success(c, {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      token,
    });
  } catch (err) {
    console.error('登录失败:', err);
    return errors.serverError(c, '登录失败，请稍后重试');
  }
});

// ============================================
// POST /auth/logout - 退出登录
// ============================================
auth.post('/logout', async (c) => {
  const user = await getUserFromRequest(c);
  if (!user) {
    return errors.authRequired(c);
  }

  // JWT 无状态，退出登录主要由前端清除 token 实现
  return success(c, { message: '已退出登录' });
});

export default auth;
