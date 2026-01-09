/**
 * 退出登录接口
 * POST /api/auth/logout
 *
 * 注意：由于使用 JWT，服务端无状态，退出登录主要由前端清除 token 实现
 * 此接口仅作为标准 API 存在，可用于未来扩展（如 token 黑名单）
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { success, errors, getUserFromRequest } from '../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return errors.methodNotAllowed(res, ['POST']);
  }

  // 验证用户登录状态（可选，即使未登录也可以调用）
  const user = await getUserFromRequest(req);
  if (!user) {
    return errors.authRequired(res);
  }

  // TODO: 如果需要实现 token 黑名单，可以在这里将 token 加入黑名单

  return success(res, {
    message: '已退出登录',
  });
}
