/**
 * 数据库相关路由
 * /api/db/*
 */

import { Hono } from 'hono';
import { success, errors } from '../_lib/hono-helpers';
import { initDatabase } from '../_lib/db';

const db = new Hono();

// 初始化密钥（生产环境应使用环境变量）
const INIT_SECRET = process.env.DB_INIT_SECRET || 'init-secret-key';

// ============================================
// POST /db/init - 数据库初始化
// ============================================
db.post('/init', async (c) => {
  try {
    const body = await c.req.json();
    const { secret } = body || {};

    // 验证初始化密钥
    if (secret !== INIT_SECRET) {
      return errors.permissionDenied(c);
    }

    await initDatabase();
    return success(c, { message: '数据库初始化成功' });
  } catch (err) {
    console.error('数据库初始化失败:', err);
    return errors.serverError(c, '数据库初始化失败');
  }
});

export default db;
