/**
 * API 入口 - Vercel Serverless Function
 * 简化版本用于测试
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // 从 query 参数获取实际路径（Vercel rewrite 会传递）
  const pathParam = req.query.path;
  const subPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam || '';
  const fullPath = subPath ? `/api/${subPath}` : '/api';

  // 健康检查
  if (fullPath === '/api' || fullPath === '/api/') {
    return res.status(200).json({
      success: true,
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      endpoints: ['/api/health', '/api/test-db'],
    });
  }

  if (fullPath === '/api/health') {
    return res.status(200).json({
      success: true,
      message: 'Health check passed',
      timestamp: new Date().toISOString(),
    });
  }

  // 404
  return res.status(404).json({
    error: 'Not Found',
    path: fullPath,
  });
}
