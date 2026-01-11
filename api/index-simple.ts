/**
 * 简化的 API 测试入口
 * 用于排查部署问题
 */

import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

// 最简单的健康检查
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
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

// 404 处理
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: err.message,
    stack: err.stack,
  }, 500);
});

// 导出所有 HTTP 方法
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);

export default handle(app);
