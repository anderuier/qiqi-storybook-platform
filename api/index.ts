/**
 * API 入口 - Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { generateToken, getUserFromRequest } from './_lib/auth';
import { hashPassword, verifyPassword } from './_lib/password';

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
          '/api/db/init',
          '/api/auth/register',
          '/api/auth/login',
          '/api/user/me',
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

    // ==================== 数据库管理 API ====================
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
          visibility VARCHAR(20) DEFAULT 'private',
          page_count INTEGER DEFAULT 0,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
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

      return res.status(200).json({
        success: true,
        message: '数据库初始化成功',
        data: {
          tables: ['users', 'works', 'stories', 'storyboards', 'storyboard_pages', 'cloned_voices', 'likes', 'templates', 'tasks'],
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
