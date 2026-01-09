/**
 * 生成故事文本接口
 * POST /api/create/story
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  success,
  errors,
  getUserFromRequest,
  validateBody,
  generateText,
  getStorySystemPrompt,
  getStoryUserPrompt,
  STORY_LENGTH,
  sql,
  generateId,
} from '../_lib';

// 请求体验证 Schema
const createStorySchema = z.object({
  mode: z.enum(['free', 'template']),
  templateId: z.string().optional(),
  input: z.object({
    childName: z.string().min(1).max(20),
    childAge: z.number().int().min(3).max(6),
    theme: z.string().max(100).optional(),
    keywords: z.array(z.string()).max(5).optional(),
    style: z.enum(['warm', 'adventure', 'funny', 'educational', 'fantasy', 'friendship']),
    length: z.enum(['short', 'medium', 'long']),
  }),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return errors.methodNotAllowed(res, ['POST']);
  }

  // 验证用户登录状态
  const user = await getUserFromRequest(req);
  if (!user) {
    return errors.authRequired(res);
  }

  // 验证请求参数
  const body = validateBody(req, res, createStorySchema);
  if (!body) return;

  const { mode, templateId, input } = body;

  // 模板模式需要 templateId
  if (mode === 'template' && !templateId) {
    return errors.invalidParams(res, '模板模式需要提供 templateId');
  }

  try {
    // TODO: 如果是模板模式，从数据库获取模板信息
    // if (mode === 'template') {
    //   const template = await getTemplate(templateId);
    //   // 使用模板的预设内容
    // }

    // 生成故事
    const result = await generateText({
      messages: [
        { role: 'system', content: getStorySystemPrompt() },
        { role: 'user', content: getStoryUserPrompt(input) },
      ],
      maxTokens: 2000,
      temperature: 0.8,
    });

    const storyContent = result.content.trim();
    const wordCount = storyContent.length;
    const lengthConfig = STORY_LENGTH[input.length];
    const estimatedPages = Math.ceil(wordCount / 80); // 大约每页80字

    // 生成故事标题（从内容中提取或生成）
    const title = generateTitle(storyContent, input.childName);

    // 创建作品记录
    const workId = generateId('work');
    const storyId = generateId('story');

    // 保存到数据库
    await sql`
      INSERT INTO works (id, user_id, title, status)
      VALUES (${workId}, ${user.userId}, ${title}, 'draft')
    `;

    await sql`
      INSERT INTO stories (id, work_id, content, word_count)
      VALUES (${storyId}, ${workId}, ${storyContent}, ${wordCount})
    `;

    return success(res, {
      storyId,
      workId,
      title,
      content: storyContent,
      wordCount,
      estimatedPages,
      aiProvider: result.provider,
      aiModel: result.model,
    });
  } catch (err) {
    console.error('故事生成失败:', err);
    return errors.aiServiceError(res, '故事生成失败，请稍后重试');
  }
}

// 从故事内容生成标题
function generateTitle(content: string, childName: string): string {
  // 尝试从第一段提取关键信息
  const firstParagraph = content.split('\n')[0];

  // 简单的标题生成逻辑
  if (firstParagraph.includes('森林')) {
    return `${childName}的森林奇遇`;
  } else if (firstParagraph.includes('海洋') || firstParagraph.includes('大海')) {
    return `${childName}的海洋冒险`;
  } else if (firstParagraph.includes('星星') || firstParagraph.includes('月亮')) {
    return `${childName}的星空之旅`;
  } else if (firstParagraph.includes('动物') || firstParagraph.includes('小兔') || firstParagraph.includes('小熊')) {
    return `${childName}和动物朋友们`;
  } else {
    return `${childName}的奇妙故事`;
  }
}
