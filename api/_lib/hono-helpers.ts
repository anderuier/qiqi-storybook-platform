/**
 * Hono 框架辅助函数
 * 提供与原有 VercelRequest/VercelResponse 兼容的工具函数
 */

import type { Context } from 'hono';
import { z } from 'zod';
import { verifyToken, type UserPayload } from './auth';

// ============================================
// 响应辅助函数
// ============================================

// 成功响应
export function success<T>(c: Context, data: T, status: 200 | 201 = 200) {
  return c.json({ success: true, data }, status);
}

// 错误响应
export function error(c: Context, code: string, message: string, status: 400 | 401 | 403 | 404 | 405 | 429 | 500 | 503 = 400) {
  return c.json({ success: false, error: { code, message } }, status);
}

// 常用错误响应
export const errors = {
  authRequired: (c: Context) => error(c, 'AUTH_REQUIRED', '请先登录', 401),
  authFailed: (c: Context) => error(c, 'AUTH_FAILED', '认证失败，请重新登录', 401),
  invalidParams: (c: Context, message = '参数错误') => error(c, 'INVALID_PARAMS', message, 400),
  notFound: (c: Context, resource = '资源') => error(c, 'NOT_FOUND', `${resource}不存在`, 404),
  permissionDenied: (c: Context) => error(c, 'PERMISSION_DENIED', '无权限执行此操作', 403),
  rateLimited: (c: Context) => error(c, 'RATE_LIMITED', '请求过于频繁，请稍后再试', 429),
  serverError: (c: Context, message = '服务器内部错误') => error(c, 'SERVER_ERROR', message, 500),
  aiServiceError: (c: Context, message = 'AI 服务暂时不可用') => error(c, 'AI_SERVICE_ERROR', message, 503),
  methodNotAllowed: (c: Context, allowed: string[]) => error(c, 'METHOD_NOT_ALLOWED', `仅支持 ${allowed.join(', ')} 方法`, 405),
};

// ============================================
// 认证辅助函数
// ============================================

// 从请求中提取 Token
export function extractToken(c: Context): string | null {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// 从请求中获取用户信息
export async function getUserFromRequest(c: Context): Promise<UserPayload | null> {
  const token = extractToken(c);
  if (!token) return null;
  return verifyToken(token);
}

// ============================================
// 参数验证辅助函数
// ============================================

// 验证请求体
export async function validateBody<T extends z.ZodType>(
  c: Context,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string }> {
  try {
    const body = await c.req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { success: true, data: result.data };
  } catch {
    return { success: false, error: '无效的 JSON 格式' };
  }
}

// 验证查询参数
export function validateQuery<T extends z.ZodType>(
  c: Context,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const query = c.req.query();
  const result = schema.safeParse(query);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
  }
  return { success: true, data: result.data };
}

// 常用验证 Schema
export const schemas = {
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位').max(20, '密码最多20位'),
  nickname: z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符'),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  }),
  id: z.string().min(1, 'ID 不能为空'),
};
