/**
 * 用户相关路由
 * /api/user/*
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
import { sql } from '../_lib/db';
import { hashPassword, verifyPassword } from '../_lib/password';

const user = new Hono();

// ============================================
// GET /user/me - 获取当前用户信息
// ============================================
user.get('/me', async (c) => {
  const currentUser = await getUserFromRequest(c);
  if (!currentUser) {
    return errors.authRequired(c);
  }

  try {
    // 从数据库获取完整用户信息
    const result = await sql`
      SELECT id, email, nickname, avatar, created_at
      FROM users
      WHERE id = ${currentUser.userId}
    `;

    if (result.rows.length === 0) {
      return errors.notFound(c, '用户');
    }

    const dbUser = result.rows[0];

    // 获取用户作品统计
    const statsResult = await sql`
      SELECT
        COUNT(*) as works_count,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count
      FROM works
      WHERE user_id = ${currentUser.userId}
    `;

    const stats = statsResult.rows[0];

    return success(c, {
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
    return errors.serverError(c, '获取用户信息失败');
  }
});

// ============================================
// PUT /user/profile - 更新用户信息
// ============================================
const updateProfileSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  avatar: z.string().url().optional(),
});

user.put('/profile', async (c) => {
  const currentUser = await getUserFromRequest(c);
  if (!currentUser) {
    return errors.authRequired(c);
  }

  const validation = await validateBody(c, updateProfileSchema);
  if ('error' in validation) {
    return errors.invalidParams(c, validation.error);
  }

  const { nickname, avatar } = validation.data;

  // 至少需要更新一个字段
  if (!nickname && !avatar) {
    return errors.invalidParams(c, '请提供要更新的字段');
  }

  try {
    // 构建更新语句
    let result;
    if (nickname && avatar) {
      result = await sql`
        UPDATE users
        SET nickname = ${nickname}, avatar = ${avatar}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${currentUser.userId}
        RETURNING id, nickname, avatar
      `;
    } else if (nickname) {
      result = await sql`
        UPDATE users
        SET nickname = ${nickname}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${currentUser.userId}
        RETURNING id, nickname, avatar
      `;
    } else {
      result = await sql`
        UPDATE users
        SET avatar = ${avatar}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${currentUser.userId}
        RETURNING id, nickname, avatar
      `;
    }

    if (result.rows.length === 0) {
      return errors.notFound(c, '用户');
    }

    const updatedUser = result.rows[0];

    return success(c, {
      userId: updatedUser.id,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
    });
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return errors.serverError(c, '更新用户信息失败');
  }
});

// ============================================
// PUT /user/password - 修改密码
// ============================================
const changePasswordSchema = z.object({
  oldPassword: schemas.password,
  newPassword: schemas.password,
});

user.put('/password', async (c) => {
  const currentUser = await getUserFromRequest(c);
  if (!currentUser) {
    return errors.authRequired(c);
  }

  const validation = await validateBody(c, changePasswordSchema);
  if ('error' in validation) {
    return errors.invalidParams(c, validation.error);
  }

  const { oldPassword, newPassword } = validation.data;

  // 新旧密码不能相同
  if (oldPassword === newPassword) {
    return errors.invalidParams(c, '新密码不能与旧密码相同');
  }

  try {
    // 获取当前密码哈希
    const result = await sql`
      SELECT password_hash FROM users WHERE id = ${currentUser.userId}
    `;

    if (result.rows.length === 0) {
      return errors.notFound(c, '用户');
    }

    const currentHash = result.rows[0].password_hash;

    // 验证旧密码
    const isValid = await verifyPassword(oldPassword, currentHash);
    if (!isValid) {
      return error(c, 'PASSWORD_WRONG', '当前密码错误', 400);
    }

    // 加密新密码并更新
    const newHash = await hashPassword(newPassword);
    await sql`
      UPDATE users
      SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${currentUser.userId}
    `;

    return success(c, { message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码失败:', err);
    return errors.serverError(c, '修改密码失败');
  }
});

export default user;
