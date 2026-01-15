/**
 * 创作相关路由
 * /api/create/*
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  success,
  errors,
  validateBody,
  getUserFromRequest,
  error,
} from '../_lib/hono-helpers';
import { sql, generateId } from '../_lib/db';
import { generateText } from '../_lib/ai';
import {
  getStorySystemPrompt,
  getStoryUserPrompt,
  getStoryboardSystemPrompt,
  getStoryboardUserPrompt,
  STORY_LENGTH,
} from '../_lib/prompts';
import { generateImage, enhancePromptForChildrenBook } from '../_lib/image';

const create = new Hono();

// ============================================
// POST /create/story - 生成故事文本
// ============================================
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

create.post('/story', async (c) => {
  const user = await getUserFromRequest(c);
  if (!user) {
    return errors.authRequired(c);
  }

  const validation = await validateBody(c, createStorySchema);
  if ('error' in validation) {
    return errors.invalidParams(c, validation.error);
  }

  const { mode, templateId, input } = validation.data;

  // 模板模式需要 templateId
  if (mode === 'template' && !templateId) {
    return errors.invalidParams(c, '模板模式需要提供 templateId');
  }

  try {
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
    const estimatedPages = Math.ceil(wordCount / 80);

    // 生成故事标题
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

    return success(c, {
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
    return errors.aiServiceError(c, '故事生成失败，请稍后重试');
  }
});

// 从故事内容生成标题
function generateTitle(content: string, childName: string): string {
  const firstParagraph = content.split('\n')[0];

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

// ============================================
// POST /create/storyboard - 生成分镜剧本
// ============================================
const createStoryboardSchema = z.object({
  storyId: z.string().min(1),
  pageCount: z.number().int().min(4).max(15).optional(),
});

interface StoryboardPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  duration: number;
}

create.post('/storyboard', async (c) => {
  const user = await getUserFromRequest(c);
  if (!user) {
    return errors.authRequired(c);
  }

  const validation = await validateBody(c, createStoryboardSchema);
  if ('error' in validation) {
    return errors.invalidParams(c, validation.error);
  }

  const { storyId, pageCount } = validation.data;

  try {
    // 获取故事内容
    const storyResult = await sql`
      SELECT s.id, s.content, s.work_id, w.user_id
      FROM stories s
      JOIN works w ON s.work_id = w.id
      WHERE s.id = ${storyId}
    `;

    if (storyResult.rows.length === 0) {
      return error(c, 'STORY_NOT_FOUND', '故事不存在', 404);
    }

    const story = storyResult.rows[0];

    // 验证权限
    if (story.user_id !== user.userId) {
      return errors.permissionDenied(c);
    }

    // 生成分镜剧本
    const result = await generateText({
      messages: [
        { role: 'system', content: getStoryboardSystemPrompt() },
        { role: 'user', content: getStoryboardUserPrompt(story.content, pageCount) },
      ],
      maxTokens: 3000,
      temperature: 0.5,
    });

    // 解析 JSON 响应
    let parsedResult: { pages: StoryboardPage[] };
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析分镜剧本');
      }
      parsedResult = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('JSON 解析失败:', parseErr);
      return errors.aiServiceError(c, '分镜剧本生成格式错误，请重试');
    }

    // 验证并处理分镜数据
    const pages: StoryboardPage[] = parsedResult.pages.map((page, index) => ({
      pageNumber: page.pageNumber || index + 1,
      text: page.text,
      imagePrompt: page.imagePrompt,
      duration: estimateDuration(page.text),
    }));

    // 创建分镜记录
    const storyboardId = generateId('sb');

    await sql`
      INSERT INTO storyboards (id, work_id, story_id)
      VALUES (${storyboardId}, ${story.work_id}, ${storyId})
    `;

    // 插入分镜页面
    for (const page of pages) {
      const pageId = generateId('page');
      await sql`
        INSERT INTO storyboard_pages (id, storyboard_id, page_number, text, image_prompt, duration)
        VALUES (${pageId}, ${storyboardId}, ${page.pageNumber}, ${page.text}, ${page.imagePrompt}, ${page.duration})
      `;
    }

    // 更新作品页数
    await sql`
      UPDATE works SET page_count = ${pages.length}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${story.work_id}
    `;

    return success(c, {
      storyboardId,
      workId: story.work_id,
      pageCount: pages.length,
      pages,
      aiProvider: result.provider,
      aiModel: result.model,
    });
  } catch (err) {
    console.error('分镜剧本生成失败:', err);
    return errors.aiServiceError(c, '分镜剧本生成失败，请稍后重试');
  }
});

// 估算朗读时长（秒）
function estimateDuration(text: string): number {
  const charsPerSecond = 3;
  return Math.ceil(text.length / charsPerSecond);
}

// ============================================
// POST /create/image - 生成单张分镜图片
// ============================================
const createImageSchema = z.object({
  storyboardId: z.string().min(1),
  pageNumber: z.number().int().min(1),
  style: z.enum(['watercolor', 'cartoon', 'oil', 'anime', 'flat', '3d']),
  regenerate: z.boolean().optional().default(false),
  provider: z.enum(['dalle', 'stability', 'imagen', 'jimeng', 'siliconflow', 'custom']).optional(),
});

create.post('/image', async (c) => {
  const user = await getUserFromRequest(c);
  if (!user) {
    return errors.authRequired(c);
  }

  const validation = await validateBody(c, createImageSchema);
  if ('error' in validation) {
    return errors.invalidParams(c, validation.error);
  }

  const { storyboardId, pageNumber, style, regenerate, provider } = validation.data;

  try {
    // 获取分镜页面信息
    const pageResult = await sql`
      SELECT sp.id, sp.image_prompt, sp.image_url, sb.work_id, w.user_id
      FROM storyboard_pages sp
      JOIN storyboards sb ON sp.storyboard_id = sb.id
      JOIN works w ON sb.work_id = w.id
      WHERE sp.storyboard_id = ${storyboardId}
        AND sp.page_number = ${pageNumber}
    `;

    if (pageResult.rows.length === 0) {
      return error(c, 'PAGE_NOT_FOUND', '分镜页面不存在', 404);
    }

    const page = pageResult.rows[0];

    // 验证权限
    if (page.user_id !== user.userId) {
      return errors.permissionDenied(c);
    }

    // 如果已有图片且不是重新生成，直接返回
    if (page.image_url && !regenerate) {
      return success(c, {
        imageId: page.id,
        imageUrl: page.image_url,
        pageNumber,
        style,
        isExisting: true,
      });
    }

    // 增强 prompt
    const enhancedPrompt = enhancePromptForChildrenBook(page.image_prompt, style);

    // 生成图片
    const result = await generateImage({
      prompt: enhancedPrompt,
      size: '1024x1024',
      style: 'vivid',
      quality: 'standard',
      provider,
    });

    // 更新数据库
    await sql`
      UPDATE storyboard_pages
      SET image_url = ${result.imageUrl}
      WHERE id = ${page.id}
    `;

    return success(c, {
      imageId: page.id,
      imageUrl: result.imageUrl,
      pageNumber,
      style,
      revisedPrompt: result.revisedPrompt,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    console.error('图片生成失败:', err);
    return errors.aiServiceError(c, '图片生成失败，请稍后重试');
  }
});

// ============================================
// POST /create/images - 批量生成分镜图片（创建任务）
// ============================================
const createImagesSchema = z.object({
  storyboardId: z.string().min(1),
  style: z.enum(['watercolor', 'cartoon', 'oil', 'anime', 'flat', '3d']),
  provider: z.enum(['dalle', 'stability', 'imagen', 'jimeng', 'siliconflow', 'custom']).optional(),
});

create.post('/images', async (c) => {
  const user = await getUserFromRequest(c);
  if (!user) {
    return errors.authRequired(c);
  }

  const validation = await validateBody(c, createImagesSchema);
  if ('error' in validation) {
    return errors.invalidParams(c, validation.error);
  }

  const { storyboardId, style, provider } = validation.data;

  try {
    // 获取分镜信息和所有页面
    const storyboardResult = await sql`
      SELECT sb.id, sb.work_id, w.user_id
      FROM storyboards sb
      JOIN works w ON sb.work_id = w.id
      WHERE sb.id = ${storyboardId}
    `;

    if (storyboardResult.rows.length === 0) {
      return error(c, 'STORYBOARD_NOT_FOUND', '分镜不存在', 404);
    }

    const storyboard = storyboardResult.rows[0];

    // 验证权限
    if (storyboard.user_id !== user.userId) {
      return errors.permissionDenied(c);
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
      return error(c, 'NO_PAGES', '分镜没有页面', 400);
    }

    // 创建异步任务
    const taskId = generateId('task');
    await sql`
      INSERT INTO tasks (id, user_id, type, status, total_items, result)
      VALUES (
        ${taskId},
        ${user.userId},
        'generate_images',
        'processing',
        ${totalPages},
        ${JSON.stringify({ storyboardId, style, provider, pages: [] })}
      )
    `;

    // 尝试生成第一张图片
    const firstPage = pages[0];
    if (!firstPage.image_url) {
      try {
        const enhancedPrompt = enhancePromptForChildrenBook(firstPage.image_prompt, style);
        const result = await generateImage({
          prompt: enhancedPrompt,
          size: '1024x1024',
          provider,
        });

        // 更新页面图片
        await sql`
          UPDATE storyboard_pages
          SET image_url = ${result.imageUrl}
          WHERE id = ${firstPage.id}
        `;

        // 更新任务进度
        await sql`
          UPDATE tasks
          SET completed_items = 1,
              progress = ${Math.round((1 / totalPages) * 100)},
              result = ${JSON.stringify({
                storyboardId,
                style,
                provider,
                pages: [{ pageNumber: 1, imageUrl: result.imageUrl }],
              })},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${taskId}
        `;
      } catch (imgErr) {
        console.error('第一张图片生成失败:', imgErr);
      }
    }

    return success(c, {
      taskId,
      status: 'processing',
      totalPages,
      provider: provider || 'default',
      message: '图片生成任务已创建，请使用任务 ID 查询进度',
    });
  } catch (err) {
    console.error('批量图片生成失败:', err);
    return errors.serverError(c, '创建图片生成任务失败');
  }
});

// ============================================
// GET /create/task/:taskId - 查询任务状态
// ============================================
create.get('/task/:taskId', async (c) => {
  const user = await getUserFromRequest(c);
  if (!user) {
    return errors.authRequired(c);
  }

  const taskId = c.req.param('taskId');
  if (!taskId) {
    return errors.invalidParams(c, '缺少任务 ID');
  }

  try {
    // 查询任务
    const taskResult = await sql`
      SELECT id, user_id, type, status, progress, total_items, completed_items, result, error, created_at, updated_at
      FROM tasks
      WHERE id = ${taskId}
    `;

    if (taskResult.rows.length === 0) {
      return error(c, 'TASK_NOT_FOUND', '任务不存在', 404);
    }

    const task = taskResult.rows[0];

    // 验证权限
    if (task.user_id !== user.userId) {
      return errors.permissionDenied(c);
    }

    return success(c, {
      taskId: task.id,
      type: task.type,
      status: task.status,
      progress: task.progress,
      totalItems: task.total_items,
      completedItems: task.completed_items,
      result: task.result,
      error: task.error,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    });
  } catch (err) {
    console.error('查询任务失败:', err);
    return errors.serverError(c, '查询任务失败');
  }
});

// ============================================
// POST /create/task/:taskId/continue - 继续生成下一张图片
// ============================================
create.post('/task/:taskId/continue', async (c) => {
  const user = await getUserFromRequest(c);
  if (!user) {
    return errors.authRequired(c);
  }

  const taskId = c.req.param('taskId');
  if (!taskId) {
    return errors.invalidParams(c, '缺少任务 ID');
  }

  try {
    // 查询任务
    const taskResult = await sql`
      SELECT id, user_id, type, status, progress, total_items, completed_items, result
      FROM tasks
      WHERE id = ${taskId}
    `;

    if (taskResult.rows.length === 0) {
      return error(c, 'TASK_NOT_FOUND', '任务不存在', 404);
    }

    const task = taskResult.rows[0];

    // 验证权限
    if (task.user_id !== user.userId) {
      return errors.permissionDenied(c);
    }

    // 检查任务状态
    if (task.status === 'completed') {
      return success(c, {
        taskId: task.id,
        status: 'completed',
        message: '任务已完成',
      });
    }

    if (task.status === 'failed') {
      return error(c, 'TASK_FAILED', '任务已失败', 400);
    }

    // 解析任务结果
    const taskData = task.result as {
      storyboardId: string;
      style: string;
      provider?: string;
      pages: Array<{ pageNumber: number; imageUrl: string }>;
    };

    // 获取下一个需要生成的页面
    const nextPageNumber = task.completed_items + 1;

    const pageResult = await sql`
      SELECT id, page_number, image_prompt, image_url
      FROM storyboard_pages
      WHERE storyboard_id = ${taskData.storyboardId}
        AND page_number = ${nextPageNumber}
    `;

    if (pageResult.rows.length === 0) {
      // 没有更多页面，标记任务完成
      await sql`
        UPDATE tasks
        SET status = 'completed', progress = 100, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
      `;

      return success(c, {
        taskId: task.id,
        status: 'completed',
        message: '所有图片生成完成',
      });
    }

    const page = pageResult.rows[0];

    // 如果页面已有图片，跳过
    if (page.image_url) {
      const newCompleted = task.completed_items + 1;
      const newProgress = Math.round((newCompleted / task.total_items) * 100);
      const isCompleted = newCompleted >= task.total_items;

      await sql`
        UPDATE tasks
        SET completed_items = ${newCompleted},
            progress = ${newProgress},
            status = ${isCompleted ? 'completed' : 'processing'},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
      `;

      return success(c, {
        taskId: task.id,
        status: isCompleted ? 'completed' : 'processing',
        pageNumber: nextPageNumber,
        imageUrl: page.image_url,
        skipped: true,
        progress: newProgress,
      });
    }

    // 生成图片
    const enhancedPrompt = enhancePromptForChildrenBook(page.image_prompt, taskData.style);

    const result = await generateImage({
      prompt: enhancedPrompt,
      size: '1024x1024',
      provider: taskData.provider as any,
    });

    // 更新页面图片
    await sql`
      UPDATE storyboard_pages
      SET image_url = ${result.imageUrl}
      WHERE id = ${page.id}
    `;

    // 更新任务进度
    const newCompleted = task.completed_items + 1;
    const newProgress = Math.round((newCompleted / task.total_items) * 100);
    const isCompleted = newCompleted >= task.total_items;

    // 更新任务结果
    taskData.pages.push({
      pageNumber: nextPageNumber,
      imageUrl: result.imageUrl,
    });

    await sql`
      UPDATE tasks
      SET completed_items = ${newCompleted},
          progress = ${newProgress},
          status = ${isCompleted ? 'completed' : 'processing'},
          result = ${JSON.stringify(taskData)},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
    `;

    return success(c, {
      taskId: task.id,
      status: isCompleted ? 'completed' : 'processing',
      pageNumber: nextPageNumber,
      imageUrl: result.imageUrl,
      progress: newProgress,
      completedItems: newCompleted,
      totalItems: task.total_items,
    });
  } catch (err) {
    console.error('继续生成图片失败:', err);

    // 更新任务状态为失败
    await sql`
      UPDATE tasks
      SET status = 'failed', error = ${String(err)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
    `;

    return errors.aiServiceError(c, '图片生成失败');
  }
});

export default create;
