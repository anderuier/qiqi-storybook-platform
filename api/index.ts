/**
 * API 主入口
 * 使用 Hono 框架统一处理所有 API 请求
 * 解决 Vercel Hobby plan 12 个 Serverless Functions 限制
 */

import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';

// 导入路由模块
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import createRoutes from './routes/create';
import dbRoutes from './routes/db';

// 创建 Hono 应用
const app = new Hono().basePath('/api');

// 启用 CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================
// 健康检查
// ============================================
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      message: '童话绘本工坊 API 服务运行正常',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================
// 挂载路由模块
// ============================================
app.route('/auth', authRoutes);
app.route('/user', userRoutes);
app.route('/create', createRoutes);
app.route('/db', dbRoutes);

// ============================================
// 404 处理
// ============================================
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '接口不存在',
    },
  }, 404);
});

// ============================================
// 全局错误处理
// ============================================
app.onError((err, c) => {
  console.error('API 错误:', err);
  return c.json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: '服务器内部错误',
    },
  }, 500);
});

// 导出 Vercel 处理函数
export default handle(app);
