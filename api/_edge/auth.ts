/**
 * Edge 兼容的 JWT 验证模块
 * 使用 Web Crypto API 替代 Node.js crypto
 * 签名算法与 api/index.ts 中的完全一致（HMAC-SHA256），确保 token 互通
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 用户信息接口
export interface UserPayload {
  userId: string;
  email: string;
  nickname: string;
}

// Base64 URL 编码（Edge 兼容，不使用 Buffer）
function base64UrlEncode(data: Uint8Array): string {
  let binary = '';
  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Base64 URL 解码
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

// 导入 HMAC 密钥（Web Crypto API）
let cachedKey: CryptoKey | null = null;

async function getHmacKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const encoder = new TextEncoder();
  cachedKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return cachedKey;
}

// HMAC-SHA256 签名（与 api/index.ts 中 crypto.createHmac 输出一致）
async function hmacSign(data: string): Promise<string> {
  const key = await getHmacKey();
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

// 验证 JWT Token
async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = await hmacSign(data);
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp < Date.now()) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      nickname: payload.nickname,
    };
  } catch {
    return null;
  }
}

// 从 Edge Request 中获取用户信息
export async function getUserFromRequest(req: Request): Promise<UserPayload | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.substring(7);
    return await verifyToken(token);
  } catch {
    return null;
  }
}
