/**
 * 故事流式生成处理器
 * POST /api/create/story/stream
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type OpenAI from 'openai';
import {
  STORY_SYSTEM_PROMPT,
  STORY_STYLE_MAP,
} from '../../_lib/prompts.config.js';
import { initSSE, sendContentDelta, sendDone, sendError } from '../../_lib/sse.js';
import { saveStoryToDb } from './db-save.js';
import type { StoryDoneData } from '../../_lib/sse.types.js';

// 类型定义
interface UserPayload {
  userId: string;
  email: string;
  nickname: string;
}

// 构建故事用户 Prompt（与 story.ts 中逻辑一致）
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
    const genderText = childGender === 'male' ? '男孩' : '女孩';
    prompt += `\n主角是一个${childAge}岁的${genderText}。`;
  }

  if (style && STORY_STYLE_MAP[style]) {
    prompt += `\n故事风格要求：${STORY_STYLE_MAP[style]}。`;
  }

  return prompt;
}

/**
 * 故事流式生成处理器
 */
export async function handleStoryStream(
  req: VercelRequest,
  res: VercelResponse,
  dependencies: {
    getUserFromRequest: (req: VercelRequest) => Promise<UserPayload | null>;
    checkRateLimit: (userId: string) => Promise<{ allowed: boolean; retryAfter?: number }>;
    recordRequest: (userId: string) => Promise<void>;
    getAIClient: () => OpenAI;
  }
): Promise<void> {
  const { getUserFromRequest, checkRateLimit, recordRequest, getAIClient } = dependencies;

  // 认证检查（SSE 之前，用 JSON 返回）
  const userPayload = await getUserFromRequest(req);
  if (!userPayload) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '请先登录' },
    });
    return;
  }

  // 限流检查
  const rateLimit = await checkRateLimit(userPayload.userId);
  if (!rateLimit.allowed) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `请求太频繁，请 ${rateLimit.retryAfter} 秒后再试`,
        retryAfter: rateLimit.retryAfter,
      },
    });
    return;
  }

  // 参数解析
  const body = req.body || {};
  const input = body.input || body;
  const { theme, childName, childAge, childGender, style } = input;

  if (!theme) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: '请提供故事主题' },
    });
    return;
  }

  // 先初始化 SSE 响应，让客户端尽快收到响应头
  initSSE(res);

  // 记录请求（非阻塞关键路径，移到 SSE 初始化之后）
  recordRequest(userPayload.userId).catch(err =>
    console.error('[故事流式生成] 记录请求失败:', err)
  );

  const startTime = Date.now();
  console.log('[故事流式生成] 开始, userId:', userPayload.userId, '主题:', theme);

  try {
    const client = getAIClient();
    const userPrompt = buildStoryUserPrompt({ theme, childName, childAge, childGender, style });
    const model = process.env.AI_MODEL || process.env.CLAUDE_MODEL || 'glm-4-flash';

    console.log('[故事流式生成] 使用模型:', model);

    // 流式调用 AI API
    const stream = await client.chat.completions.create({
      model,
      max_tokens: 2000,
      temperature: 0.8,
      stream: true,
      messages: [
        { role: 'system', content: STORY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    let fullContent = '';

    // 逐 chunk 转发
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        sendContentDelta(res, delta);
      }
    }

    const aiEndTime = Date.now();
    console.log('[故事流式生成] AI 流完成! 耗时:', (aiEndTime - startTime) / 1000, '秒, 内容长度:', fullContent.length);

    // 保存到数据库
    try {
      const { storyId, workId, title } = await saveStoryToDb({
        userId: userPayload.userId,
        storyContent: fullContent,
        theme,
        childName,
        childAge,
        childGender,
        style,
      });

      const doneData: StoryDoneData = {
        storyId,
        workId,
        title,
        content: fullContent,
        wordCount: fullContent.length,
        estimatedPages: Math.ceil(fullContent.length / 100),
        aiProvider: 'claude',
        aiModel: model,
      };

      sendDone(res, doneData);

      const totalTime = Date.now();
      console.log('[故事流式生成] 完成! storyId:', storyId, 'workId:', workId, '总耗时:', (totalTime - startTime) / 1000, '秒');
    } catch (dbErr) {
      console.error('[故事流式生成] 数据库保存失败:', dbErr);
      sendError(res, 'DB_SAVE_ERROR', '故事已生成但保存失败，请重新生成');
    }
  } catch (error: any) {
    console.error('[故事流式生成] 错误:', error?.message || error);

    let errorMessage = 'AI 服务暂时不可用';
    let errorCode = 'AI_ERROR';

    if (error?.status === 429) {
      errorMessage = 'AI 服务请求过于频繁，请稍后再试';
      errorCode = 'RATE_LIMIT';
    } else if (error?.status === 401 || error?.status === 403) {
      errorMessage = 'AI 服务认证失败';
      errorCode = 'AUTH_ERROR';
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
      errorMessage = 'AI 服务连接超时，请稍后再试';
      errorCode = 'TIMEOUT';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (res.headersSent) {
      sendError(res, errorCode, errorMessage);
    } else {
      res.status(500).json({
        success: false,
        error: { code: errorCode, message: errorMessage },
      });
    }
  }
}
