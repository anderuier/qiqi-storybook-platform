/**
 * 数据库初始化接口
 * POST /api/db/init
 *
 * 用于首次部署时初始化数据库表结构
 * 生产环境应该限制访问或删除此接口
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { success, errors, initDatabase } from '../_lib';

// 初始化密钥（生产环境应使用环境变量）
const INIT_SECRET = process.env.DB_INIT_SECRET || 'init-secret-key';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return errors.methodNotAllowed(res, ['POST']);
  }

  // 验证初始化密钥
  const { secret } = req.body || {};
  if (secret !== INIT_SECRET) {
    return errors.permissionDenied(res);
  }

  try {
    await initDatabase();
    return success(res, {
      message: '数据库初始化成功',
    });
  } catch (err) {
    console.error('数据库初始化失败:', err);
    return errors.serverError(res, '数据库初始化失败');
  }
}
