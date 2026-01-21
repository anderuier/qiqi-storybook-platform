/**
 * API 入口 - Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { put, del } from '@vercel/blob';
import { webcrypto } from 'node:crypto';
import bcrypt from 'bcryptjs';
import OpenAI from 'openai';

// 数据库迁移标记（确保只执行一次）
let hasMigrated = false;

// 迁移数据库（添加缺失的字段）
async function migrateDatabase() {
  try {
    // 检查字段是否已存在
    const checkResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'storyboard_pages'
      AND column_name = 'updated_at'
    `;

    // 如果字段不存在，添加它
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
    // 静默忽略所有错误，避免影响正常请求
    console.log('数据库迁移跳过:', error.message);
  }
}

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
4. 画面描述要具体、生动，包含场景、人物、动作、表情、色彩等细节
5. 画面描述的语言与故事内容保持一致（中文故事用中文描述）

输出格式（严格按照以下格式，每页用分隔线隔开）：

---第1页---
文字：[这一页的故事文字]
画面：[详细的画面描述]

---第2页---
文字：[这一页的故事文字]
画面：[详细的画面描述]

以此类推...`;

function buildStoryboardUserPrompt(storyContent: string, pageCount: number = 8): string {
  return `请将以下故事转化为${pageCount}页的绘本分镜。

故事内容：
${storyContent}

请按照格式输出${pageCount}页分镜，每页包含"文字"和"画面"两部分。`;
}

// 解析分镜文本为结构化数据
function parseStoryboardText(text: string): Array<{pageNumber: number; text: string; imagePrompt: string}> {
  const pages: Array<{pageNumber: number; text: string; imagePrompt: string}> = [];

  // 按分隔线分割
  const sections = text.split(/---第\d+页---/).filter(s => s.trim());

  sections.forEach((section, index) => {
    const textMatch = section.match(/文字[：:]\s*(.+?)(?=画面[：:]|$)/s);
    const imageMatch = section.match(/画面[：:]\s*(.+?)$/s);

    if (textMatch || imageMatch) {
      pages.push({
        pageNumber: index + 1,
        text: textMatch ? textMatch[1].trim() : '',
        imagePrompt: imageMatch ? imageMatch[1].trim() : '',
      });
    }
  });

  return pages;
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

// 下载图片并上传到 Vercel Blob
async function uploadImageToBlob(imageUrl: string, filename: string): Promise<string> {
  try {
    // 下载图片
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // 上传到 Vercel Blob
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType,
    });

    console.log(`图片已上传到 Vercel Blob: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error('上传图片到 Blob 失败:', error);
    // 如果上传失败，返回原始 URL
    return imageUrl;
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
  // 首次请求时执行数据库迁移（不阻塞请求）
  if (!hasMigrated) {
    migrateDatabase().catch(err => console.log('[迁移] 跳过:', err.message));
    hasMigrated = true;
  }

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

    // 测试 Vercel Blob 配置
    if (fullPath === '/api/test-blob') {
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

      const envCheck = {
        BLOB_READ_WRITE_TOKEN: blobToken ? `${blobToken.substring(0, 20)}...` : '未设置',
      };

      if (!blobToken) {
        return res.status(200).json({
          success: false,
          message: 'Vercel Blob Token 未配置',
          envCheck,
          guide: '请在 Vercel 控制台创建 Blob Store，环境变量 BLOB_READ_WRITE_TOKEN 会自动添加',
        });
      }

      try {
        // 测试上传一个小文件
        const testContent = `Test file created at ${new Date().toISOString()}`;
        const blob = await put(`test/test-${Date.now()}.txt`, testContent, {
          access: 'public',
          contentType: 'text/plain',
        });

        return res.status(200).json({
          success: true,
          message: 'Vercel Blob 配置正确！',
          envCheck,
          testFile: {
            url: blob.url,
            pathname: blob.pathname,
          },
        });
      } catch (error: any) {
        return res.status(200).json({
          success: false,
          message: 'Vercel Blob 上传测试失败',
          envCheck,
          error: error.message,
        });
      }
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

    // 测试硅基流动图片生成 API（通过正式的 generateImage 函数）
    if (fullPath === '/api/test-siliconflow-full') {
      const apiKey = process.env.SILICONFLOW_API_KEY;
      const imageProvider = process.env.IMAGE_PROVIDER;

      const envCheck = {
        IMAGE_PROVIDER: imageProvider || '未设置',
        SILICONFLOW_API_KEY: apiKey ? `${apiKey.substring(0, 10)}...` : '未设置',
      };

      if (!apiKey) {
        return res.status(200).json({
          success: false,
          message: '硅基流动 API Key 未配置',
          envCheck,
        });
      }

      try {
        // 动态导入 image 模块
        const { generateImage, enhancePromptForChildrenBook } = await import('./routes/../_lib/image.js');

        const prompt = 'A cute cartoon rabbit in a forest';
        const enhancedPrompt = enhancePromptForChildrenBook(prompt, 'watercolor');

        const result = await generateImage({
          prompt: enhancedPrompt,
          size: '1024x1024',
          provider: 'siliconflow',
        });

        return res.status(200).json({
          success: true,
          message: '图片生成成功！',
          envCheck,
          result: {
            imageUrl: result.imageUrl.substring(0, 100) + '...',
            provider: result.provider,
            model: result.model,
          },
        });
      } catch (error: any) {
        return res.status(200).json({
          success: false,
          message: '图片生成失败',
          envCheck,
          error: error.message,
          stack: error.stack?.substring(0, 500),
        });
      }
    }

    // 测试硅基流动图片生成 API
    if (fullPath === '/api/test-siliconflow') {
      const apiKey = process.env.SILICONFLOW_API_KEY;
      const imageProvider = process.env.IMAGE_PROVIDER;

      // 检查环境变量
      const envCheck = {
        IMAGE_PROVIDER: imageProvider || '未设置',
        SILICONFLOW_API_KEY: apiKey ? `${apiKey.substring(0, 10)}...` : '未设置',
      };

      if (!apiKey) {
        return res.status(200).json({
          success: false,
          message: '硅基流动 API Key 未配置',
          envCheck,
          guide: '请在 https://siliconflow.cn/ 注册并获取 API Key，然后在 Vercel 环境变量中设置 SILICONFLOW_API_KEY',
        });
      }

      // 调用硅基流动 API
      try {
        const model = 'Kwai-Kolors/Kolors';

        const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            prompt: 'A cute cartoon rabbit in a forest, children book illustration style, watercolor painting, soft colors',
          }),
        });

        const responseText = await response.text();

        if (!response.ok) {
          return res.status(200).json({
            success: false,
            message: '硅基流动 API 调用失败',
            envCheck,
            debug: {
              model,
              httpStatus: response.status,
              responseBody: responseText.substring(0, 800),
            },
          });
        }

        const result = JSON.parse(responseText);
        const imageUrl = result.images?.[0]?.url || result.data?.[0]?.url;

        if (imageUrl) {
          return res.status(200).json({
            success: true,
            message: '硅基流动 API 调用成功！',
            envCheck,
            result: {
              imageUrl: imageUrl.substring(0, 100) + '...',
              model,
            },
          });
        }

        return res.status(200).json({
          success: false,
          message: '硅基流动未返回图片数据',
          envCheck,
          debug: {
            model,
            responseBody: responseText.substring(0, 500),
          },
        });
      } catch (error: any) {
        return res.status(200).json({
          success: false,
          message: '硅基流动 API 调用异常',
          envCheck,
          error: error.message,
        });
      }
    }

    // 测试 Google Imagen 图片生成 API
    if (fullPath === '/api/test-imagen') {
      const apiKey = process.env.GOOGLE_API_KEY;
      const imageProvider = process.env.IMAGE_PROVIDER;

      // 检查环境变量
      const envCheck = {
        IMAGE_PROVIDER: imageProvider || '未设置',
        GOOGLE_API_KEY: apiKey ? `${apiKey.substring(0, 10)}...` : '未设置',
      };

      if (!apiKey) {
        return res.status(200).json({
          success: false,
          message: 'Google API Key 未配置',
          envCheck,
        });
      }

      // 调用 Google Gemini 图片生成 API
      try {
        // 尝试多个模型名称
        const models = [
          'gemini-2.0-flash-preview-image-generation',
          'imagen-3.0-generate-002',
          'imagegeneration@006',
        ];
        const model = models[0];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: 'A cute cartoon rabbit in a forest, children book illustration style, watercolor painting, soft colors, no text',
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const responseText = await response.text();

        if (!response.ok) {
          return res.status(200).json({
            success: false,
            message: 'Google Gemini API 调用失败',
            envCheck,
            debug: {
              model,
              httpStatus: response.status,
              responseBody: responseText.substring(0, 1000),
            },
          });
        }

        const result = JSON.parse(responseText);
        const candidates = result.candidates;

        // 查找图片数据
        let imageData = null;
        if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
              imageData = part.inlineData;
              break;
            }
          }
        }

        if (imageData) {
          return res.status(200).json({
            success: true,
            message: 'Google Gemini 图片生成成功！',
            envCheck,
            result: {
              mimeType: imageData.mimeType,
              imageUrl: `data:${imageData.mimeType};base64,${imageData.data.substring(0, 50)}...`,
              model,
            },
          });
        }

        return res.status(200).json({
          success: false,
          message: 'Google Gemini 未返回图片数据',
          envCheck,
          debug: {
            model,
            responseBody: responseText.substring(0, 800),
          },
        });
      } catch (error: any) {
        return res.status(200).json({
          success: false,
          message: 'Google Gemini API 调用异常',
          envCheck,
          error: error.message,
        });
      }
    }

    // 测试即梦图片生成 API（保留用于调试）
    if (fullPath === '/api/test-jimeng') {
      const accessKey = process.env.JIMENG_ACCESS_KEY;
      const secretKey = process.env.JIMENG_SECRET_KEY;
      const apiMode = process.env.JIMENG_API_MODE || 'async';
      const imageProvider = process.env.IMAGE_PROVIDER;

      // 检查环境变量
      const envCheck = {
        IMAGE_PROVIDER: imageProvider || '未设置',
        JIMENG_API_MODE: apiMode,
        JIMENG_ACCESS_KEY: accessKey ? `${accessKey.substring(0, 10)}...` : '未设置',
        JIMENG_SECRET_KEY: secretKey ? `长度=${secretKey.length}` : '未设置',
      };

      if (!accessKey || !secretKey) {
        return res.status(200).json({
          success: false,
          message: '即梦 API 密钥未配置',
          envCheck,
        });
      }

      // 直接调用火山引擎 API
      try {
        const nodeCrypto = await import('node:crypto');

        const service = 'cv';
        const region = 'cn-north-1';
        const action = 'CVProcess';  // 官方示例使用 CVProcess
        const version = '2022-08-31';
        const host = 'visual.volcengineapi.com';
        const method = 'POST';
        const contentType = 'application/json';

        // 请求体 - 尝试不同的 req_key
        const requestBody = {
          req_key: 'high_aes',  // 尝试更简单的 req_key
          prompt: 'A cute cartoon rabbit',
          width: 512,
          height: 512,
          return_url: true,
        };

        // 当前时间
        const now = new Date();
        const xDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const shortDate = xDate.substring(0, 8);

        const bodyString = JSON.stringify(requestBody);
        const bodyHash = nodeCrypto.createHash('sha256').update(bodyString).digest('hex');

        // 规范请求头 - 按字母顺序
        const signedHeaders = 'content-type;host;x-content-sha256;x-date';
        const canonicalHeaders = [
          `content-type:${contentType}`,
          `host:${host}`,
          `x-content-sha256:${bodyHash}`,
          `x-date:${xDate}`,
        ].join('\n');

        // 规范查询字符串
        const canonicalQueryString = `Action=${action}&Version=${version}`;

        // 规范请求
        const canonicalRequest = [
          method,
          '/',
          canonicalQueryString,
          canonicalHeaders + '\n',
          signedHeaders,
          bodyHash,
        ].join('\n');

        const canonicalRequestHash = nodeCrypto.createHash('sha256').update(canonicalRequest).digest('hex');
        const credentialScope = `${shortDate}/${region}/${service}/request`;

        const stringToSign = [
          'HMAC-SHA256',
          xDate,
          credentialScope,
          canonicalRequestHash,
        ].join('\n');

        // 计算签名
        const kDate = nodeCrypto.createHmac('sha256', secretKey).update(shortDate).digest();
        const kRegion = nodeCrypto.createHmac('sha256', kDate).update(region).digest();
        const kService = nodeCrypto.createHmac('sha256', kRegion).update(service).digest();
        const kSigning = nodeCrypto.createHmac('sha256', kService).update('request').digest();
        const signature = nodeCrypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

        const authorization = `HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        const url = `https://${host}/?${canonicalQueryString}`;

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': contentType,
            'Host': host,
            'X-Date': xDate,
            'X-Content-Sha256': bodyHash,
            'Authorization': authorization,
          },
          body: bodyString,
        }).catch((fetchError: any) => {
          throw new Error(`Fetch 错误: ${fetchError.message} | cause: ${fetchError.cause?.message || 'unknown'}`);
        });

        const responseText = await response.text();

        return res.status(200).json({
          success: response.ok,
          message: response.ok ? '即梦 API 调用成功！' : '即梦 API 调用失败',
          envCheck,
          debug: {
            url,
            xDate,
            shortDate,
            credentialScope,
            bodyHashPrefix: bodyHash.substring(0, 20),
            canonicalRequestPreview: canonicalRequest.substring(0, 200).replace(/\n/g, '\\n'),
            stringToSignPreview: stringToSign.substring(0, 150).replace(/\n/g, '\\n'),
            signature: signature.substring(0, 20) + '...',
            httpStatus: response.status,
            responseBody: responseText.substring(0, 800),
          },
        });
      } catch (error: any) {
        return res.status(200).json({
          success: false,
          message: '即梦 API 调用异常',
          envCheck,
          error: error.message,
          stack: error.stack?.substring(0, 300),
        });
      }
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
          drafts: result.rows.map((row: any) => ({
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

      // 尝试获取 art_style 字段（如果存在）
      let artStyle = null;
      try {
        const artStyleResult = await sql`
          SELECT art_style FROM works WHERE id = ${draftId}
        `;
        artStyle = artStyleResult.rows[0]?.art_style || null;
      } catch (err) {
        // 字段可能不存在，忽略错误
        console.log('art_style field may not exist yet');
      }

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
            style: work.style,
            length: work.length,
            artStyle: artStyle,
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

      // 先查询并删除关联的图片
      const pagesResult = await sql`
        SELECT sp.image_url
        FROM storyboard_pages sp
        INNER JOIN storyboards sb ON sp.storyboard_id = sb.id
        WHERE sb.work_id = ${draftId} AND sp.image_url IS NOT NULL
      `;

      // 删除 Vercel Blob 中的图片
      for (const page of pagesResult.rows) {
        if (page.image_url && page.image_url.includes('vercel-storage.com')) {
          try {
            await del(page.image_url);
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
          works: result.rows.map((row: any) => ({
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

      // 先查询并删除关联的图片
      const pagesResult = await sql`
        SELECT sp.image_url
        FROM storyboard_pages sp
        INNER JOIN storyboards sb ON sp.storyboard_id = sb.id
        WHERE sb.work_id = ${workId} AND sp.image_url IS NOT NULL
      `;

      // 删除 Vercel Blob 中的图片
      for (const page of pagesResult.rows) {
        if (page.image_url && page.image_url.includes('vercel-storage.com')) {
          try {
            await del(page.image_url);
          } catch (error) {
            console.error('删除图片失败:', page.image_url, error);
          }
        }
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
            style: work.style,
            length: work.length,
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

        // 解析分镜文本
        const pages = parseStoryboardText(content);

        if (pages.length === 0) {
          console.error('Parse failed, raw content:', content);
          return res.status(500).json({
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: '分镜数据解析失败，请重试',
              rawContent: content.substring(0, 800),
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
            pageCount: pages.length,
            pages: pages,
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
    if (fullPath === '/api/db/init' && (req.method === 'POST' || req.method === 'GET')) {
      // 允许直接初始化（生产环境可以通过设置 DB_INIT_SECRET 环境变量来保护）
      try {

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
          image_url TEXT,
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
        await sql`ALTER TABLE works ADD COLUMN IF NOT EXISTS art_style VARCHAR(50)`;
      } catch (migrationError) {
        console.log('Migration note:', migrationError);
        // 忽略迁移错误（字段可能已存在）
      }

      // storyboard_pages 表迁移：修改 image_url 字段类型为 TEXT（支持长 URL）
      try {
        await sql`ALTER TABLE storyboard_pages ALTER COLUMN image_url TYPE TEXT`;
      } catch (migrationError) {
        console.log('Migration note (image_url):', migrationError);
      }

      return res.status(200).json({
        success: true,
        message: '数据库初始化成功',
        data: {
          tables: ['users', 'works', 'stories', 'storyboards', 'storyboard_pages', 'cloned_voices', 'likes', 'templates', 'tasks', 'rate_limits'],
        },
      });
      } catch (dbError: any) {
        console.error('数据库初始化失败:', dbError);
        return res.status(500).json({
          success: false,
          error: '数据库初始化失败',
          details: dbError.message,
        });
      }
    }

    // ==================== 图片生成 API ====================

    // 单张图片生成
    if (fullPath === '/api/create/image' && req.method === 'POST') {
      const userPayload = await getUserFromRequest(req);

      console.log('[单张图片生成] 收到请求，userPayload:', userPayload ? '已认证' : '未认证');

      if (!userPayload) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录',
          },
        });
      }

      const body = req.body || {};
      const { storyboardId, pageNumber, style, provider } = body;

      console.log('[单张图片生成] 请求参数:', { storyboardId, pageNumber, style, provider });

      if (!storyboardId || !pageNumber || !style) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '请提供分镜ID、页码和艺术风格',
          },
        });
      }

      try {
        // 获取分镜页面信息
        const pageResult = await sql`
          SELECT sp.id, sp.page_number, sp.image_prompt, sp.image_url, sb.work_id, w.user_id
          FROM storyboard_pages sp
          JOIN storyboards sb ON sp.storyboard_id = sb.id
          JOIN works w ON sb.work_id = w.id
          WHERE sp.storyboard_id = ${storyboardId} AND sp.page_number = ${pageNumber}
        `;

        console.log('[单张图片生成] SQL 查询结果:', {
          rowCount: pageResult.rows.length,
          storyboardId,
          pageNumber,
          firstRow: pageResult.rows[0] ? Object.keys(pageResult.rows[0]) : 'NO_ROWS'
        });

        if (pageResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'PAGE_NOT_FOUND',
              message: '页面不存在',
            },
          });
        }

        const page = pageResult.rows[0];
        console.log('[单张图片生成] page 对象:', JSON.stringify(page));

        // 验证 page 对象有必需的字段
        if (!page || !page.id || !page.work_id) {
          console.error('[单张图片生成] page 对象缺少必需字段:', page);
          return res.status(500).json({
            success: false,
            error: {
              code: 'INVALID_DATA',
              message: '页面数据不完整',
              details: `page.work_id is ${page?.work_id}, page.id is ${page?.id}`,
            },
          });
        }

        if (page.user_id !== userPayload.userId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: '无权访问此页面',
            },
          });
        }

        // 检查 image_prompt 是否存在
        if (!page.image_prompt) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PROMPT',
              message: `第 ${pageNumber} 页缺少画面描述`,
            },
          });
        }

        // 使用硅基流动生成图片
        const siliconflowApiKey = process.env.SILICONFLOW_API_KEY;
        if (!siliconflowApiKey) {
          throw new Error('硅基流动 API Key 未配置');
        }

        // 增强 prompt
        const stylePrompts: Record<string, string> = {
          watercolor: 'watercolor painting style, soft colors, gentle brushstrokes',
          cartoon: 'cartoon style, bright colors, simple shapes',
          oil: 'oil painting style, rich textures, vibrant colors',
          anime: 'anime style, Japanese animation, detailed characters',
          flat: 'flat illustration style, minimalist, clean lines',
          '3d': '3D rendered style, realistic lighting, depth',
        };
        const styleDesc = stylePrompts[style] || stylePrompts.watercolor;
        const enhancedPrompt = `Children's book illustration, ${page.image_prompt}, ${styleDesc}, safe for children, no text, high quality`;

        console.log(`[单张图片生成] 第 ${pageNumber} 页 prompt:`, enhancedPrompt.substring(0, 200));

        // 调用硅基流动 API（添加超时控制）
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 50000); // 50秒超时

        const requestBody = {
          model: 'Kwai-Kolors/Kolors',
          prompt: enhancedPrompt,
          image_size: '1024x1024',
          num_inference_steps: 20,
        };

        console.log('[单张图片生成] 请求体:', JSON.stringify(requestBody, null, 2));

        try {
          const imgResponse = await fetch('https://api.siliconflow.cn/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${siliconflowApiKey}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          console.log('[单张图片生成] 响应状态:', imgResponse.status, imgResponse.statusText);

          if (!imgResponse.ok) {
            const errText = await imgResponse.text();
            console.error('[单张图片生成] API 错误详情:', errText);
            throw new Error(`硅基流动 API 错误 (${imgResponse.status}): ${errText}`);
          }

          const imgResult = await imgResponse.json();
          console.log('[图片生成] API 返回响应:', JSON.stringify(imgResult).substring(0, 500));

          const originalImageUrl = imgResult.images?.[0]?.url || imgResult.data?.[0]?.url || imgResult.image_url;

          if (!originalImageUrl) {
            console.error('[图片生成] 无法提取图片 URL，响应键:', Object.keys(imgResult));
            throw new Error('硅基流动未返回图片');
          }

          console.log('[图片生成] 获取图片 URL 成功:', originalImageUrl.substring(0, 80) + '...');

          // 上传图片到 Vercel Blob
          const blobFilename = `storybook/${page.work_id}/page-${pageNumber}-${Date.now()}.png`;
          const finalImageUrl = await uploadImageToBlob(originalImageUrl, blobFilename);

          // 保存旧图片 URL（用于删除）
          const oldImageUrl = page.image_url;

          // 更新页面图片
          await sql`
            UPDATE storyboard_pages
            SET image_url = ${finalImageUrl}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${page.id}
          `;

          // 保存艺术风格到 work
          await sql`
            UPDATE works
            SET art_style = ${style}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${page.work_id}
          `;

          // 删除旧图片（如果存在且是 Vercel Blob 图片）
          if (oldImageUrl && oldImageUrl.includes('vercel-storage.com')) {
            try {
              await del(oldImageUrl);
              console.log(`[单张图片生成] 已删除旧图片: ${oldImageUrl.substring(0, 80)}...`);
            } catch (delError: any) {
              console.error(`[单张图片生成] 删除旧图片失败:`, delError.message);
              // 删除失败不影响主流程，只记录日志
            }
          }

          return res.status(200).json({
            success: true,
            data: {
              pageNumber: pageNumber,
              imageUrl: finalImageUrl,
              provider: 'siliconflow',
              model: 'Kwai-Kolors/Kolors',
            },
          });
        } catch (fetchError: any) {
          clearTimeout(timeout);
          const errorMessage = fetchError.name === 'AbortError'
            ? '图片生成超时，请重试'
            : `图片生成失败: ${fetchError.message}`;

          console.error(`生成第 ${pageNumber} 页图片失败:`, errorMessage);
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('单张图片生成失败:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: '图片生成失败',
            details: error.message,
          },
        });
      }
    }

    // 批量生成图片
    if (fullPath === '/api/create/images' && req.method === 'POST') {
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

      const body = req.body || {};
      const { storyboardId, style, provider, forceRegenerate: requestForceRegenerate } = body;

      console.log('[批量生成图片] 开始处理请求:', {
        storyboardId,
        style,
        provider,
        forceRegenerate: requestForceRegenerate,
        userId: userPayload.userId
      });

      if (!storyboardId || !style) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '请提供分镜ID和艺术风格',
          },
        });
      }

      try {
        // 获取分镜信息
        const storyboardResult = await sql`
          SELECT sb.id, sb.work_id, w.user_id
          FROM storyboards sb
          JOIN works w ON sb.work_id = w.id
          WHERE sb.id = ${storyboardId}
        `;

        if (storyboardResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'STORYBOARD_NOT_FOUND',
              message: '分镜不存在',
            },
          });
        }

        const storyboard = storyboardResult.rows[0];

        if (storyboard.user_id !== userPayload.userId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: '无权访问此分镜',
            },
          });
        }

        // 获取所有页面
        const pagesResult = await sql`
          SELECT id, page_number, image_prompt, image_url
          FROM storyboard_pages
          WHERE storyboard_id = ${storyboardId}
          ORDER BY page_number
        `;

        const pages = pagesResult.rows;
        const totalPages = pages.length;

        if (totalPages === 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'NO_PAGES',
              message: '分镜没有页面',
            },
          });
        }

        // 检查是否有已生成的图片
        const hasExistingImages = pages.some((p: any) => p.image_url);
        // 使用前端传递的 forceRegenerate 参数，如果没有传递则根据是否有旧图片自动判断
        const forceRegenerate = requestForceRegenerate !== undefined ? requestForceRegenerate : hasExistingImages;

        console.log('[批量生成图片] 检查已有图片:', {
          totalPages,
          hasExistingImages,
          requestForceRegenerate,
          forceRegenerate,
          pagesWithImages: pages.filter((p: any) => p.image_url).map((p: any) => p.page_number)
        });

        // 保存艺术风格到 work
        await sql`
          UPDATE works
          SET art_style = ${style}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${storyboard.work_id}
        `;

        // 创建异步任务
        const taskId = generateId('task');
        await sql`
          INSERT INTO tasks (id, user_id, type, status, total_items, result)
          VALUES (
            ${taskId},
            ${userPayload.userId},
            'generate_images',
            'processing',
            ${totalPages},
            ${JSON.stringify({
              storyboardId,
              workId: storyboard.work_id,
              style,
              provider,
              pages: [],
              generatedPages: [], // 新增：记录本次新生成的图片（不包括跳过的旧图片）
              forceRegenerate // 标记是否强制重新生成
            })}
          )
        `;

        // 尝试生成第一张图片（如果没有图片或需要强制重新生成）
        const firstPage = pages[0];
        if (!firstPage.image_url || forceRegenerate) {
          // 保存旧图片 URL（用于生成成功后删除）
          const oldImageUrl = firstPage.image_url;

          try {
            // 内联实现硅基流动图片生成
            const siliconflowApiKey = process.env.SILICONFLOW_API_KEY;
            if (!siliconflowApiKey) {
              throw new Error('硅基流动 API Key 未配置');
            }

            // 检查 image_prompt 是否存在
            if (!firstPage.image_prompt) {
              throw new Error('分镜页面缺少画面描述 (image_prompt)');
            }

            // 增强 prompt（将中文描述转换为英文风格描述）
            const stylePrompts: Record<string, string> = {
              watercolor: 'watercolor painting style, soft colors, gentle brushstrokes',
              cartoon: 'cartoon style, bright colors, simple shapes',
              oil: 'oil painting style, rich textures, vibrant colors',
              anime: 'anime style, Japanese animation, detailed characters',
              flat: 'flat illustration style, minimalist, clean lines',
              '3d': '3D rendered style, realistic lighting, depth',
            };
            const styleDesc = stylePrompts[style] || stylePrompts.watercolor;
            const enhancedPrompt = `Children's book illustration, ${firstPage.image_prompt}, ${styleDesc}, safe for children, no text, high quality`;

            console.log('生成图片 prompt:', enhancedPrompt.substring(0, 200));

            const imgResponse = await fetch('https://api.siliconflow.cn/v1/images/generations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${siliconflowApiKey}`,
              },
              body: JSON.stringify({
                model: 'Kwai-Kolors/Kolors',
                prompt: enhancedPrompt,
                image_size: '1024x1024',
                num_inference_steps: 20,
              }),
            });

            if (!imgResponse.ok) {
              const errText = await imgResponse.text();
              throw new Error(`硅基流动 API 错误: ${errText}`);
            }

            const imgResult = await imgResponse.json();
            const originalImageUrl = imgResult.images?.[0]?.url || imgResult.data?.[0]?.url;

            if (!originalImageUrl) {
              throw new Error('硅基流动未返回图片');
            }

            // 上传图片到 Vercel Blob
            const blobFilename = `storybook/${storyboard.work_id}/page-1-${Date.now()}.png`;
            const imageUrl = await uploadImageToBlob(originalImageUrl, blobFilename);

            // 更新页面图片
            await sql`
              UPDATE storyboard_pages
              SET image_url = ${imageUrl}
              WHERE id = ${firstPage.id}
            `;

            // 更新任务进度
            await sql`
              UPDATE tasks
              SET completed_items = 1,
                  progress = ${Math.round((1 / totalPages) * 100)},
                  result = ${JSON.stringify({
                    storyboardId,
                    workId: storyboard.work_id,
                    style,
                    provider,
                    pages: [{ pageNumber: 1, imageUrl }],
                    generatedPages: [{ pageNumber: 1, imageUrl }], // 新增：记录本次新生成的图片
                    forceRegenerate, // 保留强制重新生成标志
                  })},
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${taskId}
            `;

            // 删除旧图片（如果存在且是 Vercel Blob 图片）
            if (oldImageUrl && oldImageUrl.includes('vercel-storage.com')) {
              try {
                await del(oldImageUrl);
                console.log(`[批量生成图片] 已删除旧图片 (第1页): ${oldImageUrl.substring(0, 80)}...`);
              } catch (delError: any) {
                console.error(`[批量生成图片] 删除旧图片失败:`, delError.message);
              }
            }
          } catch (imgErr: any) {
            console.error('第一张图片生成失败:', imgErr);
            // 更新任务状态为失败
            const errorMessage = imgErr.message || '图片生成失败';
            await sql`
              UPDATE tasks
              SET status = 'failed',
                  error = ${errorMessage},
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${taskId}
            `;

            return res.status(500).json({
              success: false,
              error: {
                code: 'IMAGE_GENERATION_FAILED',
                message: errorMessage,
              },
            });
          }
        }

        return res.status(200).json({
          success: true,
          data: {
            taskId,
            status: 'processing',
            totalPages,
            provider: provider || 'siliconflow',
            message: '图片生成任务已创建，请使用任务 ID 查询进度',
          },
        });
      } catch (error: any) {
        console.error('批量图片生成失败:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: '创建图片生成任务失败',
            details: error.message,
          },
        });
      }
    }

    // 查询任务状态
    if (fullPath.startsWith('/api/create/task/') && req.method === 'GET') {
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

      const taskId = fullPath.replace('/api/create/task/', '').split('/')[0];

      try {
        const taskResult = await sql`
          SELECT id, user_id, type, status, progress, total_items, completed_items, result, error
          FROM tasks
          WHERE id = ${taskId}
        `;

        if (taskResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'TASK_NOT_FOUND',
              message: '任务不存在',
            },
          });
        }

        const task = taskResult.rows[0];

        if (task.user_id !== userPayload.userId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: '无权访问此任务',
            },
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            taskId: task.id,
            type: task.type,
            status: task.status,
            progress: task.progress,
            totalItems: task.total_items,
            completedItems: task.completed_items,
            result: task.result,
            error: task.error,
          },
        });
      } catch (error: any) {
        console.error('查询任务失败:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: '查询任务失败',
          },
        });
      }
    }

    // 继续生成下一张图片
    if (fullPath.includes('/api/create/task/') && fullPath.endsWith('/continue') && req.method === 'POST') {
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

      const taskId = fullPath.replace('/api/create/task/', '').replace('/continue', '');
      console.log('[Continue 图片生成] 收到请求:', { taskId, userId: userPayload.userId });

      try {
        // 查询任务
        const taskResult = await sql`
          SELECT id, user_id, type, status, progress, total_items, completed_items, result
          FROM tasks
          WHERE id = ${taskId}
        `;

        if (taskResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'TASK_NOT_FOUND',
              message: '任务不存在',
            },
          });
        }

        const task = taskResult.rows[0];
        console.log('[Continue 图片生成] 任务状态:', {
          taskId: task.id,
          status: task.status,
          completedItems: task.completed_items,
          totalItems: task.total_items
        });

        if (task.user_id !== userPayload.userId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: '无权访问此任务',
            },
          });
        }

        if (task.status === 'completed') {
          return res.status(200).json({
            success: true,
            data: {
              taskId: task.id,
              status: 'completed',
              progress: 100,
              completedItems: task.completed_items,
              totalItems: task.total_items,
              message: '任务已完成',
            },
          });
        }

        if (task.status === 'failed') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'TASK_FAILED',
              message: '任务已失败',
            },
          });
        }

        // 解析任务结果
        const taskData = task.result as {
          storyboardId: string;
          workId?: string;
          style: string;
          provider?: string;
          pages: Array<{ pageNumber: number; imageUrl: string }>;
          generatedPages: Array<{ pageNumber: number; imageUrl: string }>; // 新增：记录本次新生成的图片
          forceRegenerate?: boolean;
        };

        // 确保 generatedPages 存在（兼容旧数据）
        if (!taskData.generatedPages) {
          taskData.generatedPages = [];
        }

        console.log('[Continue 图片生成] 从数据库读取的 generatedPages 数量:', taskData.generatedPages.length);
        console.log('[Continue 图片生成] 任务数据:', {
          storyboardId: taskData.storyboardId,
          workId: taskData.workId,
          style: taskData.style,
          forceRegenerate: taskData.forceRegenerate,
          completedItems: task.completed_items
        });

        // 原子更新：completed_items + 1 并返回新值
        // 这样可以防止并发请求重复处理同一页
        const updateResult = await sql`
          UPDATE tasks
          SET completed_items = completed_items + 1,
              progress = ROUND((completed_items + 1)::float / total_items * 100),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${taskId} AND status = 'processing' AND completed_items < total_items
          RETURNING completed_items, total_items, status
        `;

        if (updateResult.rows.length === 0) {
          // 任务可能已完成或已达到 total_items
          console.log('[Continue 图片生成] 任务已完成或已达到总页数，返回完成状态');
          return res.status(200).json({
            success: true,
            data: {
              taskId: task.id,
              status: 'completed',
              progress: 100,
              completedItems: task.total_items,
              totalItems: task.total_items,
              message: '所有图片生成完成',
              pages: taskData.pages, // 返回所有已生成的图片
              generatedPages: taskData.generatedPages, // 返回本次新生成的图片
            },
          });
        }

        const nextPageNumber = updateResult.rows[0].completed_items;
        const totalItems = updateResult.rows[0].total_items;
        const newProgress = Math.round((nextPageNumber / totalItems) * 100);

        console.log(`[Continue 图片生成] 原子更新完成，处理第 ${nextPageNumber} / ${totalItems} 页`);

        // 检查是否已超出总页数（任务完成）
        // 注意：只有在 nextPageNumber > totalItems 时才返回完成
        // 当 nextPageNumber == totalItems 时，仍需处理最后一张图片
        if (nextPageNumber > totalItems) {
          await sql`
            UPDATE tasks
            SET status = 'completed', progress = 100, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${taskId}
          `;

          if (taskData.workId) {
            await sql`
              UPDATE works
              SET current_step = 'preview', updated_at = CURRENT_TIMESTAMP
              WHERE id = ${taskData.workId}
            `;
          }

          return res.status(200).json({
            success: true,
            data: {
              taskId: task.id,
              status: 'completed',
              progress: 100,
              completedItems: totalItems,
              totalItems: totalItems,
              message: '所有图片生成完成',
              pages: taskData.pages, // 返回所有已生成的图片
              generatedPages: taskData.generatedPages, // 返回本次新生成的图片
            },
          });
        }

        // 查询要处理的页面
        const pageResult = await sql`
          SELECT id, page_number, image_prompt, image_url
          FROM storyboard_pages
          WHERE storyboard_id = ${taskData.storyboardId}
            AND page_number = ${nextPageNumber}
        `;

        if (pageResult.rows.length === 0) {
          // 页面不存在（异常情况），标记任务完成
          await sql`
            UPDATE tasks
            SET status = 'completed', progress = 100, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${taskId}
          `;

          if (taskData.workId) {
            await sql`
              UPDATE works
              SET current_step = 'preview', updated_at = CURRENT_TIMESTAMP
              WHERE id = ${taskData.workId}
            `;
          }

          return res.status(200).json({
            success: true,
            data: {
              taskId: task.id,
              status: 'completed',
              progress: 100,
              completedItems: totalItems,
              totalItems: totalItems,
              message: '所有图片生成完成',
              pages: taskData.pages, // 返回所有已生成的图片
              generatedPages: taskData.generatedPages, // 返回本次新生成的图片
            },
          });
        }

        const page = pageResult.rows[0];
        const forceRegenerate = taskData.forceRegenerate || false;

        console.log('[Continue 图片生成] 处理页面:', {
          nextPageNumber,
          hasImage: !!page.image_url,
          forceRegenerate,
          imageUrl: page.image_url?.substring(0, 50) + '...'
        });

        // 如果页面已有图片且不是强制重新生成，跳过
        if (page.image_url && !forceRegenerate) {
          console.log('[Continue 图片生成] 跳过已有图片的页面:', nextPageNumber);

          // 确保 taskData.pages 包含当前页的图片（用于前端同步）
          const pageExists = taskData.pages.find((p: any) => p.pageNumber === nextPageNumber);
          if (!pageExists) {
            taskData.pages.push({
              pageNumber: nextPageNumber,
              imageUrl: page.image_url,
            });
          }

          // 判断任务是否完成：当已完成最后一页时任务完成
          const isCompleted = nextPageNumber >= totalItems;

          // 只有在不是最后一页的情况下才继续处理，否则返回完成状态
          const finalStatus = isCompleted ? 'completed' : 'processing';

          // 如果任务完成，更新任务状态和 work 的 current_step
          // 同时也要更新 result（确保 generatedPages 被保存）
          if (isCompleted) {
            // 同时更新 tasks.status、works.current_step 和 result
            await sql`
              UPDATE tasks
              SET status = 'completed',
                  progress = 100,
                  result = ${JSON.stringify(taskData)},
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${taskId}
            `;

            if (taskData.workId) {
              await sql`
                UPDATE works
                SET current_step = 'preview', updated_at = CURRENT_TIMESTAMP
                WHERE id = ${taskData.workId}
              `;
            }
          } else {
            // 即使未完成，也要更新 result（确保 generatedPages 被保存）
            await sql`
              UPDATE tasks
              SET result = ${JSON.stringify(taskData)},
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${taskId}
            `;
          }

          console.log(`[Continue 图片生成 跳过] 返回数据: generatedPages=${taskData.generatedPages.length}, progress=${newProgress}, status=${finalStatus}`);

          return res.status(200).json({
            success: true,
            data: {
              taskId: task.id,
              status: finalStatus,
              pageNumber: nextPageNumber,
              imageUrl: page.image_url,
              skipped: true,
              progress: newProgress,
              completedItems: nextPageNumber,
              totalItems: totalItems,
              pages: taskData.pages, // 返回所有已生成的图片，用于前端同步
              generatedPages: taskData.generatedPages, // 新增：返回本次新生成的图片（用于进度计数）
            },
          });
        }

        // 保存旧图片 URL（用于生成成功后删除）
        const oldImageUrl = page.image_url;

        // 内联实现图片生成（避免静态导入导致的问题）
        const siliconflowApiKey = process.env.SILICONFLOW_API_KEY;
        if (!siliconflowApiKey) {
          throw new Error('硅基流动 API Key 未配置');
        }

        // 检查 image_prompt 是否存在
        if (!page.image_prompt) {
          throw new Error(`第 ${nextPageNumber} 页缺少画面描述 (image_prompt)`);
        }

        // 增强 prompt
        const stylePrompts: Record<string, string> = {
          watercolor: 'watercolor painting style, soft colors, gentle brushstrokes',
          cartoon: 'cartoon style, bright colors, simple shapes',
          oil: 'oil painting style, rich textures, vibrant colors',
          anime: 'anime style, Japanese animation, detailed characters',
          flat: 'flat illustration style, minimalist, clean lines',
          '3d': '3D rendered style, realistic lighting, depth',
        };
        const styleDesc = stylePrompts[taskData.style] || stylePrompts.watercolor;
        const enhancedPrompt = `Children's book illustration, ${page.image_prompt}, ${styleDesc}, safe for children, no text, high quality`;

        console.log(`[Continue 图片生成] 生成第 ${nextPageNumber} 页图片 prompt:`, enhancedPrompt.substring(0, 200));

        // 调用硅基流动 API（添加超时控制）
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 50000); // 50秒超时

        try {
          const requestBody = {
            model: 'Kwai-Kolors/Kolors',
            prompt: enhancedPrompt,
            image_size: '1024x1024',
            num_inference_steps: 20,
          };

          console.log('[Continue 图片生成] 请求体:', JSON.stringify(requestBody, null, 2));

          const imgResponse = await fetch('https://api.siliconflow.cn/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${siliconflowApiKey}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!imgResponse.ok) {
            const errText = await imgResponse.text();
            throw new Error(`硅基流动 API 错误: ${errText}`);
          }

          const imgResult = await imgResponse.json();
          console.log('[图片生成] API 返回响应:', JSON.stringify(imgResult).substring(0, 500));

          const originalImageUrl = imgResult.images?.[0]?.url || imgResult.data?.[0]?.url || imgResult.image_url;

          if (!originalImageUrl) {
            console.error('[图片生成] 无法提取图片 URL，响应键:', Object.keys(imgResult));
            throw new Error('硅基流动未返回图片');
          }

          console.log('[图片生成] 获取图片 URL 成功:', originalImageUrl.substring(0, 80) + '...');

          // 上传图片到 Vercel Blob
          const blobFilename = `storybook/${taskData.workId || 'unknown'}/page-${nextPageNumber}-${Date.now()}.png`;
          const finalImageUrl = await uploadImageToBlob(originalImageUrl, blobFilename);

          console.log(`[Continue 图片生成] 第 ${nextPageNumber} 页图片已上传:`, finalImageUrl.substring(0, 60) + '...');

          const result = {
            imageUrl: finalImageUrl,
            provider: 'siliconflow',
            model: 'Kwai-Kolors/Kolors',
          };

          // 更新页面图片
          await sql`
            UPDATE storyboard_pages
            SET image_url = ${result.imageUrl}
            WHERE id = ${page.id}
          `;

          console.log(`[Continue 图片生成] 第 ${nextPageNumber} 页图片已更新到数据库`);

          // 删除旧图片（如果存在且是 Vercel Blob 图片）
          if (oldImageUrl && oldImageUrl.includes('vercel-storage.com')) {
            try {
              await del(oldImageUrl);
              console.log(`[Continue 图片生成] 已删除旧图片 (第${nextPageNumber}页): ${oldImageUrl.substring(0, 80)}...`);
            } catch (delError: any) {
              console.error(`[Continue 图片生成] 删除旧图片失败:`, delError.message);
              // 删除失败不影响主流程，只记录日志
            }
          }

          // 更新任务进度
          // 注意：completed_items 在开始处理时已经通过原子更新
          // 这里只需要更新 status 和 result

          // 更新任务结果
          taskData.pages.push({
            pageNumber: nextPageNumber,
            imageUrl: result.imageUrl,
          });

          // 同时添加到 generatedPages（记录本次新生成的图片）
          taskData.generatedPages.push({
            pageNumber: nextPageNumber,
            imageUrl: result.imageUrl,
          });

          console.log(`[Continue 图片生成] 第 ${nextPageNumber} 页生成成功，generatedPages 现在有 ${taskData.generatedPages.length} 张`);

          // 判断任务是否完成：当已完成最后一页时任务完成
          const isCompleted = nextPageNumber >= totalItems;

          await sql`
            UPDATE tasks
            SET status = ${isCompleted ? 'completed' : 'processing'},
                result = ${JSON.stringify(taskData)},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${taskId}
          `;

          // 如果任务完成，更新 work 的 current_step
          if (isCompleted && taskData.workId) {
            await sql`
              UPDATE works
              SET current_step = 'preview', updated_at = CURRENT_TIMESTAMP
              WHERE id = ${taskData.workId}
            `;
          }

          console.log(`[Continue 图片生成] 返回数据: generatedPages=${taskData.generatedPages.length}, progress=${newProgress}, status=${isCompleted ? 'completed' : 'processing'}`);

          return res.status(200).json({
            success: true,
            data: {
              taskId: task.id,
              status: isCompleted ? 'completed' : 'processing',
              pageNumber: nextPageNumber,
              imageUrl: result.imageUrl,
              progress: newProgress,
              completedItems: nextPageNumber,
              totalItems: totalItems,
              provider: result.provider,
              model: result.model,
              pages: taskData.pages, // 返回所有已生成的图片，用于前端同步
              generatedPages: taskData.generatedPages, // 新增：返回本次新生成的图片（用于进度计数）
            },
          });
        } catch (fetchError: any) {
          clearTimeout(timeout);
          // 处理超时或 API 错误
          const errorMessage = fetchError.name === 'AbortError'
            ? '图片生成超时，请重试'
            : `图片生成失败: ${fetchError.message}`;

          console.error(`生成第 ${nextPageNumber} 页图片失败:`, errorMessage);

          // 关键修复：API 调用失败时回滚 completed_items
          // 这样前端重试时可以继续处理失败的图片
          try {
            await sql`
              UPDATE tasks
              SET completed_items = completed_items - 1,
                  progress = ROUND((completed_items - 1)::float / total_items * 100),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${taskId}
            `;
            console.log(`[Continue 图片生成] 已回滚 completed_items (${nextPageNumber} -> ${nextPageNumber - 1})`);
          } catch (rollbackError: any) {
            console.error('[Continue 图片生成] 回滚 completed_items 失败:', rollbackError.message);
          }

          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('继续生成图片失败:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: '图片生成失败',
            details: error.message,
          },
        });
      }
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
