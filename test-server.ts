/**
 * 本地 API 测试服务器
 * 使用 Node.js 直接运行，不依赖 Vercel
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

// 健康检查
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  });
});

// 根路径
app.get('/api', (c) => {
  return c.json({
    success: true,
    message: 'API root',
    endpoints: ['/api/health', '/api/test-db', '/api/db/init'],
  });
});

// 测试数据库连接
app.get('/api/test-db', async (c) => {
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
app.post('/api/db/init', async (c) => {
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

    const { initDatabase } = await import('./api/_lib/db.js');
    await initDatabase();

    return c.json({
      success: true,
      message: '数据库初始化成功',
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
  console.error('Error:', err);
  return c.json({
    error: err.message,
    stack: err.stack,
  }, 500);
});

const port = 3001;
console.log(`🚀 本地 API 服务器启动在 http://localhost:${port}`);
console.log(`📍 测试地址: http://localhost:${port}/api/health`);

serve({
  fetch: app.fetch,
  port,
});
