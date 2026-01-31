/**
 * API 入口 - Vercel Serverless Function (模块化版本)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { put, del } from '@vercel/blob';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import OpenAI from 'openai';
import { registerStoryRoutes } from './modules/story.js';
import { registerStoryboardRoutes } from './modules/storyboard.js';
import { registerImageRoutes } from './modules/images.js';

// 数据库迁移标记
let hasMigrated = false;

// 迁移数据库
async function migrateDatabase() {
  try {
    const checkResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'storyboard_pages'
      AND column_name = 'updated_at'
    `;

    if (checkResult.rows.length === 0) {
      await sql`
        ALTER TABLE storyboard_pages
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `;
      console.log('数据库迁移完成：storyboard_pages.updated_at 字段已添加');
    } else {
      console.log('数据库迁移：storyboard_pages.updated_at 字段已存在');
    }
  } catch (error: any) {
    console.log('数据库迁移跳过:', error.message);
  }
}

// ==================== 工具函数 ====================

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000;

// 用户信息接口
interface UserPayload {
  userId: string;
  email: string;
  nickname: string;
}

// Base64 URL 编码
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

// JWT 签名
async function sign(payload: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(payload);
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return `${data}.${signature}`;
}

// 生成 Token
async function generateToken(user: UserPayload): Promise<string> {
  const payload = JSON.stringify({
    userId: user.userId,
    email: user.email,
    nickname: user.nickname,
    exp: Date.now() + JWT_EXPIRES_IN,
  });
  return await sign(payload);
}

// 验证 Token
async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

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

// 从请求中获取用户
async function getUserFromRequest(req: VercelRequest): Promise<UserPayload | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.substring(7);
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// 密码哈希
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 验证密码
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成 ID
function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${randomStr}`;
}

// AI 客户端
let aiClient: OpenAI | null = null;

function getAIClient(): OpenAI {
  if (!aiClient) {
    aiClient = new OpenAI({
      apiKey: process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
      baseURL: process.env.AI_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/',
      defaultHeaders: {
        'User-Agent': 'StoryBook/1.0',
      },
    });
  }
  return aiClient;
}

// 限流检查
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limit = 10; // 每小时10次
  const windowMs = 60 * 60 * 1000; // 1小时

  const now = Date.now();
  const cutoffTime = new Date(now - windowMs);

  // 清理过期记录 - 直接使用 ISO 时间戳
  await sql`
    DELETE FROM rate_limits WHERE created_at < ${cutoffTime.toISOString()}
  `;

  // 检查当前请求数
  const result = await sql`
    SELECT COUNT(*) as count FROM rate_limits WHERE user_id = ${userId}
  `;

  const count = parseInt(result.rows[0].count);

  if (count >= limit) {
    // 计算最早记录的剩余时间
    const oldestResult = await sql`
      SELECT created_at FROM rate_limits WHERE user_id = ${userId} ORDER BY created_at ASC LIMIT 1
    `;
    if (oldestResult.rows.length > 0) {
      const oldestTime = new Date(oldestResult.rows[0].created_at).getTime();
      const retryAfter = Math.ceil((oldestTime + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }
  }

  return { allowed: true };
}

// 记录请求
async function recordRequest(userId: string): Promise<void> {
  const requestId = generateId('rate');
  await sql`
    INSERT INTO rate_limits (id, user_id, created_at)
    VALUES (${requestId}, ${userId}, CURRENT_TIMESTAMP)
  `;
}

// ==================== 路由系统 ====================

interface RouteHandler {
  method: string;
  pattern: RegExp | string;
  handler: (req: VercelRequest, res: VercelResponse, matches?: RegExpMatchArray) => VercelResponse | Promise<VercelResponse> | void | Promise<void>;
}

class Router {
  private routes: RouteHandler[] = [];

  get(pattern: string | RegExp, handler: RouteHandler['handler']) {
    this.routes.push({ method: 'GET', pattern, handler });
  }

  post(pattern: string | RegExp, handler: RouteHandler['handler']) {
    this.routes.push({ method: 'POST', pattern, handler });
  }

  put(pattern: string | RegExp, handler: RouteHandler['handler']) {
    this.routes.push({ method: 'PUT', pattern, handler });
  }

  delete(pattern: string | RegExp, handler: RouteHandler['handler']) {
    this.routes.push({ method: 'DELETE', pattern, handler });
  }

  async handle(req: VercelRequest, res: VercelResponse, fullPath: string): Promise<boolean> {
    const method = req.method || 'GET';

    for (const route of this.routes) {
      if (route.method !== method) continue;

      let matches: RegExpMatchArray | null = null;

      if (route.pattern instanceof RegExp) {
        matches = fullPath.match(route.pattern);
        if (matches) {
          await route.handler(req, res, matches);
          return true;
        }
      } else if (route.pattern === fullPath) {
        await route.handler(req, res);
        return true;
      }
    }

    return false;
  }
}

// ==================== 主处理函数 ====================

const router = new Router();

// 注册模块路由
const dependencies = {
  getUserFromRequest,
  checkRateLimit,
  recordRequest,
  getAIClient,
};

registerStoryRoutes(router, dependencies);
registerStoryboardRoutes(router, dependencies);
registerImageRoutes(router, dependencies);

// 注册其他路由

// 健康检查
router.get('/api/health', async (_req: VercelRequest, res: VercelResponse) => {
  return res.status(200).json({
    success: true,
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
  });
});

// API 根路径
router.get('/api', async (_req: VercelRequest, res: VercelResponse) => {
  return res.status(200).json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/health',
      '/api/test-db',
      '/api/auth/register',
      '/api/auth/login',
      '/api/user/me',
      '/api/works',
      '/api/drafts',
      '/api/drafts/:id',
      '/api/create/story',
      '/api/create/storyboard',
      '/api/create/images',
    ],
  });
});

// 用户注册
router.post('/api/auth/register', async (req: VercelRequest, res: VercelResponse) => {
  const { email, password, nickname } = req.body || {};

  if (!email || !password || !nickname) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: '邮箱、密码和昵称不能为空',
      },
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: '邮箱格式不正确',
      },
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: '密码长度至少6位',
      },
    });
  }

  const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existingUser.rows.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message: '该邮箱已被注册',
      },
    });
  }

  const userId = generateId('user');
  const passwordHash = await hashPassword(password);

  await sql`
    INSERT INTO users (id, email, password_hash, nickname)
    VALUES (${userId}, ${email}, ${passwordHash}, ${nickname})
  `;

  const token = await generateToken({
    userId,
    email,
    nickname,
  });

  return res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: userId,
        email,
        nickname,
        avatar: '/images/avatar-default.webp',
      },
    },
  });
});

// 用户登录
router.post('/api/auth/login', async (req: VercelRequest, res: VercelResponse) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: '邮箱和密码不能为空',
      },
    });
  }

  const result = await sql`
    SELECT id, email, password_hash, nickname, avatar
    FROM users
    WHERE email = ${email}
  `;

  if (result.rows.length === 0) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: '邮箱或密码错误',
      },
    });
  }

  const user = result.rows[0];
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: '邮箱或密码错误',
      },
    });
  }

  const token = await generateToken({
    userId: user.id,
    email: user.email,
    nickname: user.nickname,
  });

  return res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar?.trim() || '/images/avatar-default.webp',
      },
    },
  });
});

// 获取当前用户信息
router.get('/api/user/me', async (req: VercelRequest, res: VercelResponse) => {
  const userPayload = await getUserFromRequest(req);

  if (!userPayload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    });
  }

  const result = await sql`
    SELECT id, email, nickname, avatar, created_at
    FROM users
    WHERE id = ${userPayload.userId}
  `;

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      },
    });
  }

  const user = result.rows[0];

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar?.trim() || '/images/avatar-default.webp',
      createdAt: user.created_at,
    },
  });
});

// 获取我的作品列表（包括草稿和已发布）
router.get('/api/works', async (req: VercelRequest, res: VercelResponse) => {
  const userPayload = await getUserFromRequest(req);

  if (!userPayload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    });
  }

  const status = req.query.status as string || 'all';

  let result;
  if (status === 'all') {
    result = await sql`
      SELECT
        w.id, w.title, w.status, w.current_step, w.cover_url, w.page_count, w.views, w.likes, w.created_at, w.updated_at,
        sp.image_url as first_image_url
      FROM works w
      LEFT JOIN LATERAL (
        SELECT sp.image_url
        FROM storyboard_pages sp
        JOIN storyboards sb ON sp.storyboard_id = sb.id
        WHERE sb.work_id = w.id AND sp.image_url IS NOT NULL
        ORDER BY sb.created_at DESC, sp.page_number ASC
        LIMIT 1
      ) sp ON true
      WHERE w.user_id = ${userPayload.userId}
      ORDER BY w.updated_at DESC
      LIMIT 50
    `;
  } else {
    result = await sql`
      SELECT
        w.id, w.title, w.status, w.current_step, w.cover_url, w.page_count, w.views, w.likes, w.created_at, w.updated_at,
        sp.image_url as first_image_url
      FROM works w
      LEFT JOIN LATERAL (
        SELECT sp.image_url
        FROM storyboard_pages sp
        JOIN storyboards sb ON sp.storyboard_id = sb.id
        WHERE sb.work_id = w.id AND sp.image_url IS NOT NULL
        ORDER BY sb.created_at DESC, sp.page_number ASC
        LIMIT 1
      ) sp ON true
      WHERE w.user_id = ${userPayload.userId} AND w.status = ${status}
      ORDER BY w.updated_at DESC
      LIMIT 50
    `;
  }

  return res.status(200).json({
    success: true,
    data: {
      total: result.rows.length,
      page: 1,
      pageSize: 50,
      works: result.rows.map((row: any) => ({
        workId: row.id,
        title: row.title,
        status: row.status,
        currentStep: row.current_step,
        coverUrl: row.cover_url,
        pageCount: row.page_count,
        views: row.views,
        likes: row.likes,
        firstImageUrl: row.first_image_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        stats: {
          views: row.views,
          likes: row.likes,
        },
      })),
    },
  });
});

// 草稿列表
router.get('/api/drafts', async (req: VercelRequest, res: VercelResponse) => {
  const userPayload = await getUserFromRequest(req);

  if (!userPayload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    });
  }

  const result = await sql`
    SELECT id, title, status, current_step, theme, child_name, child_age, child_gender, style, page_count, cover_url, created_at, updated_at
    FROM works
    WHERE user_id = ${userPayload.userId} AND status = 'draft'
    ORDER BY updated_at DESC
    LIMIT 20
  `;

  return res.status(200).json({
    success: true,
    data: {
      drafts: result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        currentStep: row.current_step,
        theme: row.theme,
        childName: row.child_name,
        childAge: row.child_age,
        childGender: row.child_gender,
        style: row.style,
        pageCount: row.page_count,
        coverUrl: row.cover_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    },
  });
});

// 草稿详情
router.get(/^\/api\/drafts\/([^/]+)$/, async (req: VercelRequest, res: VercelResponse, matches) => {
  const userPayload = await getUserFromRequest(req);

  if (!userPayload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    });
  }

  const draftId = matches?.[1];

  const workResult = await sql`
    SELECT id, title, status, current_step, theme, child_name, child_age, child_gender, style, page_count, cover_url, created_at, updated_at
    FROM works
    WHERE id = ${draftId} AND user_id = ${userPayload.userId}
  `;

  if (workResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'DRAFT_NOT_FOUND',
        message: '草稿不存在',
      },
    });
  }

  const work = workResult.rows[0];

  const storyResult = await sql`
    SELECT id, content, word_count FROM stories WHERE work_id = ${draftId} LIMIT 1
  `;
  const story = storyResult.rows[0] || null;

  const storyboardResult = await sql`
    SELECT id FROM storyboards WHERE work_id = ${draftId} ORDER BY created_at DESC LIMIT 1
  `;
  const storyboard = storyboardResult.rows[0] || null;

  let pages: any[] = [];
  if (storyboard) {
    const pagesResult = await sql`
      SELECT id, page_number, text, image_prompt, image_url, audio_url
      FROM storyboard_pages
      WHERE storyboard_id = ${storyboard.id}
      ORDER BY page_number ASC
    `;
    pages = pagesResult.rows.map((row: any) => ({
      pageNumber: row.page_number,
      text: row.text,
      imagePrompt: row.image_prompt,
      imageUrl: row.image_url,
      audioUrl: row.audio_url,
    }));
  }

  return res.status(200).json({
    success: true,
    data: {
      work: {
        id: work.id,
        title: work.title,
        status: work.status,
        currentStep: work.current_step,
        theme: work.theme,
        childName: work.child_name,
        childAge: work.child_age,
        childGender: work.child_gender,
        style: work.style,
        pageCount: work.page_count,
        coverUrl: work.cover_url,
        createdAt: work.created_at,
        updatedAt: work.updated_at,
      },
      story: story ? {
        id: story.id,
        content: story.content,
        wordCount: story.word_count,
      } : null,
      storyboard: storyboard ? {
        id: storyboard.id,
        pages,
      } : null,
    },
  });
});

// 删除草稿
router.delete(/^\/api\/drafts\/([^/]+)$/, async (req: VercelRequest, res: VercelResponse, matches) => {
  const userPayload = await getUserFromRequest(req);

  if (!userPayload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    });
  }

  const draftId = matches?.[1];

  // 验证权限
  const workResult = await sql`
    SELECT user_id FROM works WHERE id = ${draftId}
  `;

  if (workResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'DRAFT_NOT_FOUND',
        message: '草稿不存在',
      },
    });
  }

  if (workResult.rows[0].user_id !== userPayload.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: '无权删除此草稿',
      },
    });
  }

  // 先查询并删除关联的图片
  const pagesResult = await sql`
    SELECT sp.image_url
    FROM storyboard_pages sp
    INNER JOIN storyboards sb ON sp.storyboard_id = sb.id
    WHERE sb.work_id = ${draftId} AND sp.image_url IS NOT NULL
  `;

  // 删除 Vercel Blob 中的图片
  for (const page of pagesResult.rows) {
    if (page.image_url && (page.image_url.includes('blob.vercel-storage.com') || page.image_url.includes('public.blob.vercel-storage.com'))) {
      try {
        await del(page.image_url);
        console.log(`[删除图片] ${page.image_url.substring(0, 80)}...`);
      } catch (error) {
        console.error('删除图片失败:', page.image_url, error);
      }
    }
  }

  // 删除草稿（级联删除关联的 stories, storyboards, storyboard_pages）
  await sql`DELETE FROM works WHERE id = ${draftId}`;

  return res.status(200).json({
    success: true,
    message: '草稿已删除',
  });
});

// 获取作品详情
router.get(/^\/api\/works\/([^/]+)$/, async (req: VercelRequest, res: VercelResponse, matches) => {
  const userPayload = await getUserFromRequest(req);

  if (!userPayload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    });
  }

  const workId = matches?.[1];

  const workResult = await sql`
    SELECT id, title, status, current_step, theme, child_name, child_age, child_gender, style, art_style, page_count, cover_url, created_at, updated_at
    FROM works
    WHERE id = ${workId} AND user_id = ${userPayload.userId}
  `;

  if (workResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'WORK_NOT_FOUND',
        message: '作品不存在',
      },
    });
  }

  const work = workResult.rows[0];

  // 获取故事内容
  const storyResult = await sql`
    SELECT id, content, word_count FROM stories WHERE work_id = ${workId} LIMIT 1
  `;
  const story = storyResult.rows[0] || null;

  // 获取分镜信息
  const storyboardResult = await sql`
    SELECT id FROM storyboards WHERE work_id = ${workId} ORDER BY created_at DESC LIMIT 1
  `;
  const storyboard = storyboardResult.rows[0] || null;

  let pages: any[] = [];
  if (storyboard) {
    const pagesResult = await sql`
      SELECT id, page_number, text, image_prompt, image_url, audio_url
      FROM storyboard_pages
      WHERE storyboard_id = ${storyboard.id}
      ORDER BY page_number ASC
    `;
    pages = pagesResult.rows.map((row: any) => ({
      pageNumber: row.page_number,
      text: row.text,
      imagePrompt: row.image_prompt,
      imageUrl: row.image_url,
      audioUrl: row.audio_url,
    }));
  }

  return res.status(200).json({
    success: true,
    data: {
      work: {
        id: work.id,
        title: work.title,
        status: work.status,
        currentStep: work.current_step,
        theme: work.theme,
        childName: work.child_name,
        childAge: work.child_age,
        childGender: work.child_gender,
        style: work.style,
        artStyle: work.art_style,
        pageCount: work.page_count,
        coverUrl: work.cover_url,
        createdAt: work.created_at,
        updatedAt: work.updated_at,
      },
      story: story ? {
        id: story.id,
        content: story.content,
        wordCount: story.word_count,
      } : null,
      storyboard: storyboard ? {
        id: storyboard.id,
        pages,
      } : null,
    },
  });
});

// 删除作品
router.delete(/^\/api\/works\/([^/]+)$/, async (req: VercelRequest, res: VercelResponse, matches) => {
  const userPayload = await getUserFromRequest(req);

  if (!userPayload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    });
  }

  const workId = matches?.[1];

  // 验证权限
  const workResult = await sql`
    SELECT user_id FROM works WHERE id = ${workId}
  `;

  if (workResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'WORK_NOT_FOUND',
        message: '作品不存在',
      },
    });
  }

  if (workResult.rows[0].user_id !== userPayload.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: '无权删除此作品',
      },
    });
  }

  // 先查询并删除关联的图片
  const pagesResult = await sql`
    SELECT sp.image_url
    FROM storyboard_pages sp
    INNER JOIN storyboards sb ON sp.storyboard_id = sb.id
    WHERE sb.work_id = ${workId} AND sp.image_url IS NOT NULL
  `;

  // 删除 Vercel Blob 中的图片
  for (const page of pagesResult.rows) {
    if (page.image_url && (page.image_url.includes('blob.vercel-storage.com') || page.image_url.includes('public.blob.vercel-storage.com'))) {
      try {
        await del(page.image_url);
        console.log(`[删除图片] ${page.image_url.substring(0, 80)}...`);
      } catch (error) {
        console.error('删除图片失败:', page.image_url, error);
      }
    }
  }

  await sql`DELETE FROM works WHERE id = ${workId}`;

  return res.status(200).json({
    success: true,
    message: '作品已删除',
  });
});

// 数据库初始化
router.post('/api/db/init', async (_req: VercelRequest, res: VercelResponse) => {
  try {
    await sql`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      avatar VARCHAR(500) DEFAULT '/images/avatar-default.webp',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS works (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      cover_url VARCHAR(500),
      status VARCHAR(20) DEFAULT 'draft',
      current_step VARCHAR(20) DEFAULT 'input',
      visibility VARCHAR(20) DEFAULT 'private',
      page_count INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      theme VARCHAR(200),
      child_name VARCHAR(50),
      child_age INTEGER,
      child_gender VARCHAR(10),
      style VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS stories (
      id VARCHAR(36) PRIMARY KEY,
      work_id VARCHAR(36) REFERENCES works(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      word_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS storyboards (
      id VARCHAR(36) PRIMARY KEY,
      work_id VARCHAR(36) REFERENCES works(id) ON DELETE CASCADE,
      story_id VARCHAR(36) REFERENCES stories(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS storyboard_pages (
      id VARCHAR(36) PRIMARY KEY,
      storyboard_id VARCHAR(36) NOT NULL REFERENCES storyboards(id) ON DELETE CASCADE,
      page_number INTEGER NOT NULL,
      text TEXT NOT NULL,
      image_prompt TEXT,
      image_url TEXT,
      audio_url VARCHAR(500),
      duration INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'processing',
      progress INTEGER DEFAULT 0,
      total_items INTEGER DEFAULT 0,
      completed_items INTEGER DEFAULT 0,
      result JSONB,
      error TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS rate_limits (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_user_time ON rate_limits (user_id, created_at)`;

    return res.status(200).json({
      success: true,
      message: '数据库初始化成功',
    });
  } catch (dbError: any) {
    return res.status(500).json({
      success: false,
      error: '数据库初始化失败',
      details: dbError.message,
    });
  }
});

router.get('/api/db/init', async (_req: VercelRequest, res: VercelResponse) => {
  return res.status(200).json({
    success: true,
    message: '请使用 POST 请求初始化数据库',
  });
});

// ==================== 导出主处理函数 ====================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 首次请求时执行数据库迁移
  if (!hasMigrated) {
    migrateDatabase().catch(err => console.log('[迁移] 跳过:', err.message));
    hasMigrated = true;
  }

  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 从 query 参数获取实际路径
  const pathParam = req.query.path;
  const subPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam || '';
  const fullPath = subPath ? `/api/${subPath}` : '/api';

  try {
    // 尝试路由匹配
    const handled = await router.handle(req, res, fullPath);
    if (handled) return;

    // 404
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      path: fullPath,
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
