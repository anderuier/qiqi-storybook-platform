/**
 * API 入口 - Vercel Serverless Function
 * 简化版本用于测试
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url || '/';

  // 健康检查
  if (path === '/api' || path === '/api/') {
    return res.status(200).json({
      success: true,
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      endpoints: ['/api/health'],
    });
  }

  if (path === '/api/health') {
    return res.status(200).json({
      success: true,
      message: 'Health check passed',
      timestamp: new Date().toISOString(),
    });
  }

  // 404
  return res.status(404).json({
    error: 'Not Found',
    path: path,
  });
}
