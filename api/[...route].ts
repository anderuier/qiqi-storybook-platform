/**
 * API 入口 - Vercel Serverless Function
 * 路径: /api/*
 */

import { Hono } from 'hono';
import { handle } from 'hono/vercel';

// 使用 basePath 匹配 Vercel 的路由
const app = new Hono().basePath('/api');

// 健康检查
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  });
});

// 根路径
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'API root',
    endpoints: ['/api/health', '/api/test-db', '/api/db/init'],
  });
});

// 测试数据库连接
app.get('/test-db', async (c) => {
  try {
    const { sql } = await import('@vercel/postgres');
    const result = await sql`SELECT NOW()`;
    return c.json({
      success: true,
      message: 'Database connected!',
      time: result.rows[0],
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 数据库初始化
app.post('/db/init', async (c) => {
  try {
    const body = await c.req.json();
    const { secret } = body || {};

    const DB_INIT_SECRET = process.env.DB_INIT_SECRET || 'init-secret-key';

    if (secret !== DB_INIT_SECRET) {
      return c.json({
        success: false,
        error: 'Invalid secret',
      }, 403);
    }

    const { initDatabase } = await import('./_lib/db.js');
    await initDatabase();

    return c.json({
      success: true,
      data: { message: '数据库初始化成功' },
    });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 404 处理
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    path: c.req.path,
    method: c.req.method,
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  }, 500);
});

// Vercel Serverless Function 导出
// 需要显式导出每个 HTTP 方法
const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;

export default handler;
