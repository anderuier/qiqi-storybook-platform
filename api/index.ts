/**
 * API 入口 - Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        endpoints: ['/api/health', '/api/test-db', '/api/db/init'],
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

    // 初始化数据库
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
