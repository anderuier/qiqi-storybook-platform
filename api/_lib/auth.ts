/**
 * JWT 认证工具函数
 */

import { webcrypto } from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

// 使用 Node.js 的 webcrypto API
const crypto = webcrypto;

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 天

// 用户信息接口
export interface UserPayload {
  userId: string;
  email: string;
  nickname: string;
}

// 简单的 Base64 编码/解码（用于 JWT）
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString();
}

// 简单的 HMAC 签名（生产环境建议使用 jsonwebtoken 库）
async function sign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

// 生成 JWT Token
export async function generateToken(user: UserPayload): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      ...user,
      exp: Date.now() + JWT_EXPIRES_IN,
      iat: Date.now(),
    })
  );
  const signature = await sign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

// 验证 JWT Token
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = await sign(`${header}.${payload}`);

    if (signature !== expectedSignature) return null;

    const data = JSON.parse(base64UrlDecode(payload));

    // 检查是否过期
    if (data.exp && data.exp < Date.now()) return null;

    return {
      userId: data.userId,
      email: data.email,
      nickname: data.nickname,
    };
  } catch {
    return null;
  }
}

// 从请求中提取 Token
export function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// 从请求中获取用户信息
export async function getUserFromRequest(
  req: VercelRequest
): Promise<UserPayload | null> {
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}
