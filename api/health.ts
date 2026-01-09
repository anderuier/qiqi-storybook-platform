/**
 * 健康检查接口
 * GET /api/health
 * 用于测试 API 是否正常运行
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { success, errors } from './_lib/response';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 GET 方法
  if (req.method !== 'GET') {
    return errors.methodNotAllowed(res, ['GET']);
  }

  return success(res, {
    status: 'ok',
    message: '童话绘本工坊 API 服务运行正常',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
