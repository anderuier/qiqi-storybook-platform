/**
 * API 入口 - Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { webcrypto } from 'node:crypto';
import bcrypt from 'bcryptjs';
import OpenAI from 'openai';

// ==================== 工具函数 ====================

// 使用 Node.js 的 webcrypto API
const crypto = webcrypto;

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 天

// ==================== AI Prompt 配置 ====================
// 配置文件：api/prompts.config.ts（完整版本和文档）
// 这里是内联版本，修改后需同步更新配置文件

const STORY_SYSTEM_PROMPT = `你是一位专业的儿童故事作家，擅长为3-6岁学龄前儿童创作温馨、有趣、富有教育意义的童话故事。

创作要求：
1. 语言简单易懂，使用短句，避免复杂词汇，适合幼儿理解
2. 故事情节生动有趣，富有想象力，有明确的开头、发展和结尾
3. 包含积极正面的价值观和教育意义（如友善、勇敢、分享、诚实等）
4. 角色形象可爱，性格鲜明，容易引起孩子共鸣
5. 适当使用拟声词和重复句式，增加趣味性
6. 可以包含简单的对话和互动元素
7. 故事要有一个温馨或有启发性的结局

输出格式：
- 直接输出故事内容，不需要标题标记
- 使用自然段落分隔
- 对话使用引号标注`;

const STORY_STYLE_MAP: Record<string, string> = {
  warm: '温馨感人，充满爱与关怀',
  adventure: '冒险刺激，充满探索精神',
  funny: '幽默搞笑，轻松愉快',
  educational: '寓教于乐，包含知识点',
  fantasy: '奇幻魔法，充满想象力',
  friendship: '友情主题，强调友谊的珍贵',
};

const STORY_LENGTH_MAP: Record<string, string> = {
  short: '简短的故事，约300-500字，适合睡前快速阅读',
  medium: '中等长度的故事，约500-800字，情节完整',
  long: '较长的故事，约800-1200字，情节丰富有层次',
};

function buildStoryUserPrompt(params: {
  theme: string;
  childName?: string;
  childAge?: number;
  style?: string;
  length?: string;
}): string {
  const { theme, childName, childAge, style, length } = params;

  let prompt = `请为我创作一个关于"${theme}"的童话故事。`;

  if (childName) {
    prompt += `\n主角名字叫"${childName}"。`;
  }

  if (childAge) {
    prompt += `\n故事适合${childAge}岁的孩子阅读。`;
  }

  if (style && STORY_STYLE_MAP[style]) {
    prompt += `\n故事风格要求：${STORY_STYLE_MAP[style]}。`;
  }

  if (length && STORY_LENGTH_MAP[length]) {
    prompt += `\n故事长度要求：${STORY_LENGTH_MAP[length]}。`;
  }

  return prompt;
}

// ==================== 分镜生成 Prompt ====================

const STORYBOARD_SYSTEM_PROMPT = `你是一位专业的绘本分镜师，擅长将儿童故事转化为适合绘本呈现的分镜剧本。

分镜要求：
1. 每一页应该是一个完整的场景或情节片段
2. 每页文字控制在30-50字，适合幼儿阅读
3. 为每页提供详细的画面描述，用于后续图片生成
4. 画面描述要具体、生动，包含场景、人物、动作、表情等细节
5. 保持故事的连贯性和节奏感
6. 重要情节可以用多页展现，增强表现力
7. imagePrompt 的语言与故事内容保持一致（中文故事用中文描述，英文故事用英文描述）

输出格式要求：
请严格按照以下 JSON 格式输出，不要添加任何其他内容：
{
  "pages": [
    {
      "pageNumber": 1,
      "text": "页面上显示的故事文字（30-50字）",
      "imagePrompt": "详细的画面描述，用于AI绘图（包含场景、人物、动作、表情、色彩等）"
    }
  ]
}`;

function buildStoryboardUserPrompt(storyContent: string, pageCount: number = 8): string {
  return `请将以下故事转化为${pageCount}页的绘本分镜：

故事内容：
${storyContent}

要求：
1. 分成${pageCount}页，每页一个场景
2. 每页文字简短（30-50字），适合3-6岁儿童朗读
3. imagePrompt 语言与故事内容保持一致，要详细具体，便于AI绘图
4. 只输出 JSON，不要有其他内容`;
}

// ==================== AI 配置 ====================

// 限流配置
const RATE_LIMIT = {
  AI_REQUESTS_PER_MINUTE: 2,  // 每用户每分钟 AI 请求次数
  AI_REQUESTS_PER_HOUR: 20,   // 每用户每小时 AI 请求次数
};

// 内存限流存储（Serverless 环境下每次请求可能是新实例，所以同时使用数据库）
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// 检查限流（使用数据库持久化）
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  try {
    // 清理过期记录（1小时前的）
    await sql`
      DELETE FROM rate_limits
      WHERE user_id = ${userId} AND created_at < to_timestamp(${oneHourAgo / 1000})
    `;

    // 查询最近1分钟的请求次数
    const minuteResult = await sql`
      SELECT COUNT(*) as count
      FROM rate_limits
      WHERE user_id = ${userId} AND created_at > to_timestamp(${oneMinuteAgo / 1000})
    `;
    const minuteCount = parseInt(minuteResult.rows[0]?.count || '0');

    if (minuteCount >= RATE_LIMIT.AI_REQUESTS_PER_MINUTE) {
      // 计算需要等待的时间
      const oldestInMinute = await sql`
        SELECT created_at
        FROM rate_limits
        WHERE user_id = ${userId} AND created_at > to_timestamp(${oneMinuteAgo / 1000})
        ORDER BY created_at ASC
        LIMIT 1
      `;
      const oldestTime = oldestInMinute.rows[0]?.created_at;
      const retryAfter = oldestTime ? Math.ceil((new Date(oldestTime).getTime() + 60000 - now) / 1000) : 60;

      return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
    }

    // 查询最近1小时的请求次数
    const hourResult = await sql`
      SELECT COUNT(*) as count
      FROM rate_limits
      WHERE user_id = ${userId} AND created_at > to_timestamp(${oneHourAgo / 1000})
    `;
    const hourCount = parseInt(hourResult.rows[0]?.count || '0');

    if (hourCount >= RATE_LIMIT.AI_REQUESTS_PER_HOUR) {
      return { allowed: false, retryAfter: 60 };
    }

    return { allowed: true };
  } catch (error) {
    // 如果数据库查询失败，允许请求（降级处理）
    console.error('Rate limit check error:', error);
    return { allowed: true };
  }
}

// 记录请求
async function recordRequest(userId: string): Promise<void> {
  try {
    const id = generateId('rl');
    await sql`
      INSERT INTO rate_limits (id, user_id, created_at)
      VALUES (${id}, ${userId}, NOW())
    `;
  } catch (error) {
    console.error('Record request error:', error);
  }
}

// OpenAI 兼容客户端（支持第三方 Claude API）
let aiClient: OpenAI | null = null;
function getAIClient(): OpenAI {
  if (!aiClient) {
    aiClient = new OpenAI({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.openai.com/v1',
      defaultHeaders: {
        'User-Agent': 'StoryBook/1.0',
      },
    });
  }
  return aiClient;
}

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
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString();
}

// HMAC 签名
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
async function generateToken(user: UserPayload): Promise<string> {
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
async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = await sign(`${header}.${payload}`);

    if (signature !== expectedSignature) return null;

    const data = JSON.parse(base64UrlDecode(payload));

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

// 从请求中获取用户信息
async function getUserFromRequest(req: VercelRequest): Promise<UserPayload | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyToken(token);
}

// 密码加密
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成唯一 ID
function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 从 query 参数获取实际路径（Vercel rewrite 会传递）
  const pathParam = req.query.path;
  const subPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam || '';
  const fullPath = subPath ? `/api/${subPath}` : '/api';

  try {
    // API 根路径
    if (fullPath === '/api' || fullPath === '/api/') {
      return res.status(200).json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        endpoints: [
          '/api/health',
          '/api/test-db',
          '/api/test-ai',
          '/api/db/init',
          '/api/auth/register',
          '/api/auth/login',
          '/api/user/me',
          '/api/works',
          '/api/drafts',
          '/api/drafts/:id',
          '/api/create/story',
          '/api/create/storyboard',
        ],
      });
    }

    // 健康检查
    if (fullPath === '/api/health') {
      return res.status(200).json({
        success: true,
        message: 'Health check passed',
        timestamp: new Date().toISOString(),
      });
    }

    // 测试数据库连接
    if (fullPath === '/api/test-db') {
      const result = await sql`SELECT NOW() as current_time`;
      return res.status(200).json({
        success: true,
        message: 'Database connected!',
        data: {
          currentTime: result.rows[0].current_time,
        },
      });
    }

    // ==================== 用户认证 API ====================

    // 用户注册
    if (fullPath === '/api/auth/register' && req.method === 'POST') {
      const { email, password, nickname } = req.body || {};

      // 验证必填字段
      if (!email || !password || !nickname) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '邮箱、密码和昵称不能为空',
          },
        });
      }

      // 验证邮箱格式
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

      // 验证密码长度
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: '密码长度至少6位',
          },
        });
      }

      // 检查邮箱是否已存在
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

      // 创建用户
      const userId = generateId('user');
      const passwordHash = await hashPassword(password);

      await sql`
        INSERT INTO users (id, email, password_hash, nickname)
        VALUES (${userId}, ${email}, ${passwordHash}, ${nickname})
      `;

      // 生成 Token
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
            avatar: '/images/avatar-default.png',
          },
        },
      });
    }

    // 用户登录
    if (fullPath === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = req.body || {};

      // 验证必填字段
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '邮箱和密码不能为空',
          },
        });
      }

      // 查找用户
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

      // 验证密码
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

      // 生成 Token
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
            avatar: user.avatar,
          },
        },
      });
    }

    // 获取当前用户信息
    if (fullPath === '/api/user/me' && req.method === 'GET') {
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

      // 从数据库获取最新用户信息
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
          avatar: user.avatar,
          createdAt: user.created_at,
        },
      });
    }

    // ==================== 草稿管理 API ====================

    // 获取草稿列表
    if (fullPath === '/api/drafts' && req.method === 'GET') {
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
        SELECT id, title, status, current_step, theme, child_name, child_age, style, length, page_count, cover_url, created_at, updated_at
        FROM works
        WHERE user_id = ${userPayload.userId} AND status = 'draft'
        ORDER BY updated_at DESC
        LIMIT 20
      `;

      return res.status(200).json({
        success: true,
        data: {
          drafts: result.rows.map(row => ({
            id: row.id,
            title: row.title,
            status: row.status,
            currentStep: row.current_step,
            theme: row.theme,
            childName: row.child_name,
            childAge: row.child_age,
            style: row.style,
            length: row.length,
            pageCount: row.page_count,
            coverUrl: row.cover_url,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })),
        },
      });
    }

    // 获取草稿详情（用于恢复创作）
    if (fullPath.match(/^\/api\/drafts\/[^/]+$/) && req.method === 'GET') {
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

      const draftId = fullPath.split('/').pop();

      // 获取 work 基本信息
      const workResult = await sql`
        SELECT id, title, status, current_step, theme, child_name, child_age, style, length, page_count, cover_url, created_at, updated_at
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

      // 获取故事内容
      const storyResult = await sql`
        SELECT id, content, word_count FROM stories WHERE work_id = ${draftId} LIMIT 1
      `;
      const story = storyResult.rows[0] || null;

      // 获取分镜信息
      const storyboardResult = await sql`
        SELECT id FROM storyboards WHERE work_id = ${draftId} LIMIT 1
      `;
      const storyboard = storyboardResult.rows[0] || null;

      // 获取分镜页面
      let pages: any[] = [];
      if (storyboard) {
        const pagesResult = await sql`
          SELECT id, page_number, text, image_prompt, image_url, audio_url
          FROM storyboard_pages
          WHERE storyboard_id = ${storyboard.id}
          ORDER BY page_number ASC
        `;
        pages = pagesResult.rows.map(row => ({
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
            style: work.style,
            length: work.length,
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
    }

    // 删除草稿
    if (fullPath.match(/^\/api\/drafts\/[^/]+$/) && req.method === 'DELETE') {
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

      const draftId = fullPath.split('/').pop();

      // 验证草稿存在且属于当前用户
      const workResult = await sql`
        SELECT id FROM works WHERE id = ${draftId} AND user_id = ${userPayload.userId}
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

      // 删除草稿（级联删除关联的 stories, storyboards, storyboard_pages）
      await sql`DELETE FROM works WHERE id = ${draftId}`;

      return res.status(200).json({
        success: true,
        message: '草稿已删除',
      });
    }

    // ==================== 作品管理 API ====================

    // 获取我的作品列表（包括草稿和已发布）
    if (fullPath === '/api/works' && req.method === 'GET') {
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
          SELECT id, title, status, current_step, cover_url, page_count, views, likes, created_at, updated_at
          FROM works
          WHERE user_id = ${userPayload.userId}
          ORDER BY updated_at DESC
          LIMIT 50
        `;
      } else {
        result = await sql`
          SELECT id, title, status, current_step, cover_url, page_count, views, likes, created_at, updated_at
          FROM works
          WHERE user_id = ${userPayload.userId} AND status = ${status}
          ORDER BY updated_at DESC
          LIMIT 50
        `;
      }

      return res.status(200).json({
        success: true,
        data: {
          total: result.rows.length,
          page: 1,
          pageSize: 50,
          works: result.rows.map(row => ({
            workId: row.id,
            title: row.title,
            status: row.status,
            currentStep: row.current_step,
            coverUrl: row.cover_url,
            pageCount: row.page_count || 0,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            stats: {
              views: row.views || 0,
              likes: row.likes || 0,
            },
          })),
        },
      });
    }

    // 删除作品
    if (fullPath.match(/^\/api\/works\/[^/]+$/) && req.method === 'DELETE') {
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

      const workId = fullPath.split('/').pop();

      // 验证作品存在且属于当前用户
      const workResult = await sql`
        SELECT id FROM works WHERE id = ${workId} AND user_id = ${userPayload.userId}
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

      // 删除作品（级联删除关联的 stories, storyboards, storyboard_pages）
      await sql`DELETE FROM works WHERE id = ${workId}`;

      return res.status(200).json({
        success: true,
        message: '作品已删除',
      });
    }

    // 获取作品详情
    if (fullPath.match(/^\/api\/works\/[^/]+$/) && req.method === 'GET') {
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

      const workId = fullPath.split('/').pop();

      // 获取 work 基本信息
      const workResult = await sql`
        SELECT id, title, status, current_step, theme, child_name, child_age, style, length, page_count, cover_url, created_at, updated_at
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
        SELECT id FROM storyboards WHERE work_id = ${workId} LIMIT 1
      `;
      const storyboard = storyboardResult.rows[0] || null;

      // 获取分镜页面
      let pages: any[] = [];
      if (storyboard) {
        const pagesResult = await sql`
          SELECT id, page_number, text, image_prompt, image_url, audio_url
          FROM storyboard_pages
          WHERE storyboard_id = ${storyboard.id}
          ORDER BY page_number ASC
        `;
        pages = pagesResult.rows.map(row => ({
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
            style: work.style,
            length: work.length,
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
    }

    // ==================== 数据库管理 API ====================

    // ==================== AI 故事生成 API ====================

    // 生成故事
    if (fullPath === '/api/create/story' && req.method === 'POST') {
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

      // 检查限流
      const rateLimit = await checkRateLimit(userPayload.userId);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `请求太频繁，请 ${rateLimit.retryAfter} 秒后再试`,
            retryAfter: rateLimit.retryAfter,
          },
        });
      }

      // 支持两种请求格式
      const body = req.body || {};
      const input = body.input || body;
      const { theme, childName, childAge, style, length } = input;

      if (!theme) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '请提供故事主题',
          },
        });
      }

      // 记录请求（在实际调用 AI 之前记录）
      await recordRequest(userPayload.userId);

      try {
        const client = getAIClient();

        // 使用配置文件中的函数构建用户提示
        const userPrompt = buildStoryUserPrompt({
          theme,
          childName,
          childAge,
          style,
          length,
        });

        const response = await client.chat.completions.create({
          model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          temperature: 0.8,
          messages: [
            {
              role: 'system',
              content: STORY_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        });

        const story = response.choices[0]?.message?.content || '';

        // 生成故事 ID 和作品 ID
        const storyId = generateId('story');
        const workId = generateId('work');

        // 从故事中提取标题（第一行或前20个字）
        const firstLine = story.split('\n')[0].replace(/^[#\s*]+/, '').trim();
        const title = firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine || '我的童话故事';

        // 保存到数据库（带重试）
        let dbSaveSuccess = false;
        let dbError = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            // 创建 work 记录
            await sql`
              INSERT INTO works (id, user_id, title, status, current_step, theme, child_name, child_age, style, length)
              VALUES (${workId}, ${userPayload.userId}, ${title}, 'draft', 'story', ${theme}, ${childName || null}, ${childAge || null}, ${style || null}, ${length || null})
            `;

            // 创建 story 记录
            await sql`
              INSERT INTO stories (id, work_id, content, word_count)
              VALUES (${storyId}, ${workId}, ${story}, ${story.length})
            `;

            dbSaveSuccess = true;
            break;
          } catch (err) {
            dbError = err;
            console.error(`DB save attempt ${attempt} failed:`, err);
            if (attempt < 3) {
              // 等待一小段时间后重试
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }

        if (!dbSaveSuccess) {
          console.error('All DB save attempts failed:', dbError);
          // 数据库保存完全失败，返回错误让用户重试
          return res.status(500).json({
            success: false,
            error: {
              code: 'DB_SAVE_ERROR',
              message: '故事已生成但保存失败，请重新生成',
              storyPreview: story.substring(0, 200) + '...',
            },
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            storyId,
            workId,
            title,
            content: story,
            wordCount: story.length,
            estimatedPages: Math.ceil(story.length / 100),
            aiProvider: 'claude',
            aiModel: response.model || 'claude-haiku',
          },
        });
      } catch (error) {
        console.error('AI Error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'AI_ERROR',
            message: error instanceof Error ? error.message : 'AI 服务暂时不可用',
          },
        });
      }
    }

    // 生成分镜
    if (fullPath === '/api/create/storyboard' && req.method === 'POST') {
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

      // 检查限流
      const rateLimit = await checkRateLimit(userPayload.userId);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `请求太频繁，请 ${rateLimit.retryAfter} 秒后再试`,
            retryAfter: rateLimit.retryAfter,
          },
        });
      }

      const body = req.body || {};
      const { storyContent, pageCount = 8, workId } = body;

      if (!storyContent) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '请提供故事内容',
          },
        });
      }

      if (!workId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '请提供作品ID',
          },
        });
      }

      // 验证 work 存在且属于当前用户
      const workResult = await sql`
        SELECT id, user_id FROM works WHERE id = ${workId} AND user_id = ${userPayload.userId}
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

      // 获取关联的 story_id
      const storyResult = await sql`
        SELECT id FROM stories WHERE work_id = ${workId} LIMIT 1
      `;
      const storyId = storyResult.rows[0]?.id || null;

      // 验证页数范围
      const validPageCount = Math.min(Math.max(parseInt(pageCount) || 8, 4), 16);

      // 记录请求
      await recordRequest(userPayload.userId);

      try {
        const client = getAIClient();

        const userPrompt = buildStoryboardUserPrompt(storyContent, validPageCount);

        const response = await client.chat.completions.create({
          model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: STORYBOARD_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        });

        const content = response.choices[0]?.message?.content || '';

        // 解析 JSON 响应
        let storyboard;
        try {
          // 尝试多种方式提取 JSON
          let jsonStr = content;

          // 1. 尝试提取 markdown 代码块中的 JSON
          const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          } else {
            // 2. 尝试直接提取 JSON 对象
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonStr = jsonMatch[0];
            }
          }

          storyboard = JSON.parse(jsonStr);

          // 验证数据结构
          if (!storyboard.pages || !Array.isArray(storyboard.pages)) {
            throw new Error('分镜数据格式错误：缺少 pages 数组');
          }
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError, 'Content:', content.substring(0, 1000));
          return res.status(500).json({
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: '分镜数据解析失败，请重试',
              rawContent: content.substring(0, 500),
            },
          });
        }

        // 生成分镜 ID
        const storyboardId = generateId('sb');

        // 保存到数据库：创建 storyboard 记录
        await sql`
          INSERT INTO storyboards (id, work_id, story_id)
          VALUES (${storyboardId}, ${workId}, ${storyId})
        `;

        // 保存分镜页面
        const pages = storyboard.pages || [];
        for (const page of pages) {
          const pageId = generateId('page');
          await sql`
            INSERT INTO storyboard_pages (id, storyboard_id, page_number, text, image_prompt)
            VALUES (${pageId}, ${storyboardId}, ${page.pageNumber}, ${page.text}, ${page.imagePrompt})
          `;
        }

        // 更新 work 的当前步骤和页数
        await sql`
          UPDATE works
          SET current_step = 'storyboard', page_count = ${pages.length}, updated_at = NOW()
          WHERE id = ${workId}
        `;

        return res.status(200).json({
          success: true,
          data: {
            storyboardId,
            pageCount: storyboard.pages?.length || 0,
            pages: storyboard.pages || [],
            aiProvider: 'claude',
            aiModel: response.model || 'claude-haiku',
          },
        });
      } catch (error) {
        console.error('Storyboard AI Error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'AI_ERROR',
            message: error instanceof Error ? error.message : 'AI 服务暂时不可用',
          },
        });
      }
    }

    // 测试 AI 连接
    if (fullPath === '/api/test-ai') {
      try {
        const client = getAIClient();
        const response = await client.chat.completions.create({
          model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: '请用一句话介绍自己。',
            },
          ],
        });

        const content = response.choices[0]?.message?.content || '';

        return res.status(200).json({
          success: true,
          message: 'AI 连接成功',
          data: {
            response: content,
            model: response.model,
          },
        });
      } catch (error: any) {
        console.error('AI Test Error:', error);

        // 返回更详细的错误信息
        const errorDetails = {
          message: error?.message || 'Unknown error',
          status: error?.status,
          code: error?.code,
          type: error?.type,
          baseURL: process.env.ANTHROPIC_BASE_URL,
          model: process.env.CLAUDE_MODEL,
        };

        return res.status(500).json({
          success: false,
          error: {
            code: 'AI_ERROR',
            message: error instanceof Error ? error.message : 'AI 连接失败',
            details: errorDetails,
          },
        });
      }
    }

    // ==================== 数据库初始化 ====================
    if (fullPath === '/api/db/init' && req.method === 'POST') {
      const { secret } = req.body || {};
      const DB_INIT_SECRET = process.env.DB_INIT_SECRET || 'init-secret-key';

      if (secret !== DB_INIT_SECRET) {
        return res.status(403).json({
          success: false,
          error: 'Invalid secret',
        });
      }

      // 创建用户表
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          nickname VARCHAR(50) NOT NULL,
          avatar VARCHAR(500) DEFAULT '/images/avatar-default.png',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 创建作品表
      await sql`
        CREATE TABLE IF NOT EXISTS works (
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
          style VARCHAR(50),
          length VARCHAR(20),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 创建故事表
      await sql`
        CREATE TABLE IF NOT EXISTS stories (
          id VARCHAR(36) PRIMARY KEY,
          work_id VARCHAR(36) REFERENCES works(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          word_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 创建分镜表
      await sql`
        CREATE TABLE IF NOT EXISTS storyboards (
          id VARCHAR(36) PRIMARY KEY,
          work_id VARCHAR(36) REFERENCES works(id) ON DELETE CASCADE,
          story_id VARCHAR(36) REFERENCES stories(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 创建分镜页面表
      await sql`
        CREATE TABLE IF NOT EXISTS storyboard_pages (
          id VARCHAR(36) PRIMARY KEY,
          storyboard_id VARCHAR(36) NOT NULL REFERENCES storyboards(id) ON DELETE CASCADE,
          page_number INTEGER NOT NULL,
          text TEXT NOT NULL,
          image_prompt TEXT,
          image_url VARCHAR(500),
          audio_url VARCHAR(500),
          duration INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 创建克隆声音表
      await sql`
        CREATE TABLE IF NOT EXISTS cloned_voices (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          voice_id VARCHAR(100),
          duration INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'processing',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 创建点赞表
      await sql`
        CREATE TABLE IF NOT EXISTS likes (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          work_id VARCHAR(36) NOT NULL REFERENCES works(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, work_id)
        )
      `;

      // 创建模板表
      await sql`
        CREATE TABLE IF NOT EXISTS templates (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          cover_url VARCHAR(500),
          category VARCHAR(50),
          tags TEXT[],
          story_outline TEXT,
          suggested_styles TEXT[],
          usage_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 创建异步任务表
      await sql`
        CREATE TABLE IF NOT EXISTS tasks (
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
        )
      `;

      // 创建限流记录表
      await sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 创建限流表索引
      await sql`
        CREATE INDEX IF NOT EXISTS idx_rate_limits_user_time
        ON rate_limits (user_id, created_at)
      `;

      // ==================== 数据库迁移 ====================
      // 为已存在的表添加新字段（如果不存在）

      // works 表迁移：添加新字段
      try {
        await sql`ALTER TABLE works ADD COLUMN IF NOT EXISTS current_step VARCHAR(20) DEFAULT 'input'`;
        await sql`ALTER TABLE works ADD COLUMN IF NOT EXISTS theme VARCHAR(200)`;
        await sql`ALTER TABLE works ADD COLUMN IF NOT EXISTS child_name VARCHAR(50)`;
        await sql`ALTER TABLE works ADD COLUMN IF NOT EXISTS child_age INTEGER`;
        await sql`ALTER TABLE works ADD COLUMN IF NOT EXISTS style VARCHAR(50)`;
        await sql`ALTER TABLE works ADD COLUMN IF NOT EXISTS length VARCHAR(20)`;
      } catch (migrationError) {
        console.log('Migration note:', migrationError);
        // 忽略迁移错误（字段可能已存在）
      }

      return res.status(200).json({
        success: true,
        message: '数据库初始化成功',
        data: {
          tables: ['users', 'works', 'stories', 'storyboards', 'storyboard_pages', 'cloned_voices', 'likes', 'templates', 'tasks', 'rate_limits'],
        },
      });
    }

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
