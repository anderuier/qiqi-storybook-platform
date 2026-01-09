/**
 * API 响应工具函数
 * 统一响应格式
 */

import type { VercelResponse } from '@vercel/node';

// 成功响应
export function success<T>(res: VercelResponse, data: T, status = 200) {
  return res.status(status).json({
    success: true,
    data,
  });
}

// 错误响应
export function error(
  res: VercelResponse,
  code: string,
  message: string,
  status = 400
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

// 常用错误响应快捷方法
export const errors = {
  // 认证相关
  authRequired: (res: VercelResponse) =>
    error(res, 'AUTH_REQUIRED', '请先登录', 401),

  authFailed: (res: VercelResponse) =>
    error(res, 'AUTH_FAILED', '认证失败，请重新登录', 401),

  // 参数相关
  invalidParams: (res: VercelResponse, message = '参数错误') =>
    error(res, 'INVALID_PARAMS', message, 400),

  // 资源相关
  notFound: (res: VercelResponse, resource = '资源') =>
    error(res, 'NOT_FOUND', `${resource}不存在`, 404),

  // 权限相关
  permissionDenied: (res: VercelResponse) =>
    error(res, 'PERMISSION_DENIED', '无权限执行此操作', 403),

  // 频率限制
  rateLimited: (res: VercelResponse) =>
    error(res, 'RATE_LIMITED', '请求过于频繁，请稍后再试', 429),

  // 服务器错误
  serverError: (res: VercelResponse, message = '服务器内部错误') =>
    error(res, 'SERVER_ERROR', message, 500),

  // AI 服务错误
  aiServiceError: (res: VercelResponse, message = 'AI 服务暂时不可用') =>
    error(res, 'AI_SERVICE_ERROR', message, 503),

  // 方法不允许
  methodNotAllowed: (res: VercelResponse, allowed: string[]) =>
    error(res, 'METHOD_NOT_ALLOWED', `仅支持 ${allowed.join(', ')} 方法`, 405),
};
