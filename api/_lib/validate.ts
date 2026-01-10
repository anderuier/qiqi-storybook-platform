/**
 * 参数验证工具函数
 * 使用 Zod 进行类型安全的参数验证
 */

import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { errors } from './response';

// 验证请求体
export function validateBody<T extends z.ZodType>(
  req: VercelRequest,
  res: VercelResponse,
  schema: T
): z.infer<T> | null {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    errors.invalidParams(res, `${firstError.path.join('.')}: ${firstError.message}`);
    return null;
  }
  return result.data;
}

// 验证查询参数
export function validateQuery<T extends z.ZodType>(
  req: VercelRequest,
  res: VercelResponse,
  schema: T
): z.infer<T> | null {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const firstError = result.error.issues[0];
    errors.invalidParams(res, `${firstError.path.join('.')}: ${firstError.message}`);
    return null;
  }
  return result.data;
}

// 常用验证 Schema
export const schemas = {
  // 邮箱
  email: z.string().email('邮箱格式不正确'),

  // 密码（6-20位）
  password: z.string().min(6, '密码至少6位').max(20, '密码最多20位'),

  // 昵称（2-20字符）
  nickname: z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符'),

  // 分页参数
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  }),

  // ID 参数
  id: z.string().min(1, 'ID 不能为空'),
};
