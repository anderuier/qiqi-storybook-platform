/**
 * 故事生成模块
 * POST /api/create/story
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';

// 从主文件导入的类型和函数（需要在主文件中导出）
interface UserPayload {
  userId: string;
  email: string;
  nickname: string;
}

// 故事生成 Prompt
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

function buildStoryUserPrompt(params: {
  theme: string;
  childName?: string;
  childAge?: number;
  childGender?: string;
  style?: string;
}): string {
  const { theme, childName, childAge, childGender, style } = params;

  let prompt = `请为我创作一个关于"${theme}"的童话故事。`;

  if (childName) {
    prompt += `\n主角名字叫"${childName}"。`;
  }

  if (childGender) {
    const genderText = childGender === "male" ? "男孩" : "女孩";
    prompt += `\n主角是一个${childAge}岁的${genderText}。`;
  }

  if (style && STORY_STYLE_MAP[style]) {
    prompt += `\n故事风格要求：${STORY_STYLE_MAP[style]}。`;
  }

  return prompt;
}

function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${randomStr}`;
}

/**
 * 注册故事生成路由
 */
export function registerStoryRoutes(
  app: any,
  dependencies: {
    getUserFromRequest: (req: VercelRequest) => Promise<UserPayload | null>;
    checkRateLimit: (userId: string) => Promise<{ allowed: boolean; retryAfter?: number }>;
    recordRequest: (userId: string) => Promise<void>;
    getAIClient: () => OpenAI;
  }
) {
  const { getUserFromRequest, checkRateLimit, recordRequest, getAIClient } = dependencies;

  app.post('/api/create/story', async (req: VercelRequest, res: VercelResponse) => {
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
    const { theme, childName, childAge, childGender, style } = input;

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
        childGender,
        style,
      });

      const response = await client.chat.completions.create({
        model: process.env.AI_MODEL || process.env.CLAUDE_MODEL || 'glm-4-flash',
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
            INSERT INTO works (id, user_id, title, status, current_step, theme, child_name, child_age, child_gender, style)
            VALUES (${workId}, ${userPayload.userId}, ${title}, 'draft', 'story', ${theme}, ${childName || null}, ${childAge || null}, ${childGender || null}, ${style || null})
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
  });
}
