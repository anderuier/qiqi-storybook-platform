/**
 * 图片生成模块
 *
 * 包含以下 API 端点：
 * - POST /api/create/image - 单张图片生成
 * - POST /api/create/images - 批量生成图片（启动任务）
 * - GET /api/create/task/:id - 查询任务状态
 * - POST /api/create/task/:id/continue - 继续生成下一张图片
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { put, del } from '@vercel/blob';

// 类型定义
interface UserPayload {
  userId: string;
  email: string;
  nickname: string;
}

// 辅助函数
function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${randomStr}`;
}

async function uploadImageToBlob(imageUrl: string, filename: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.statusText}`);
  }
  const blob = await response.blob();
  const result = await put(filename, blob, {
    access: 'public',
    contentType: 'image/png',
  });
  return result.url;
}

// 图片生成风格配置
const STYLE_PROMPTS: Record<string, string> = {
  watercolor: 'watercolor painting style, soft colors, gentle brushstrokes',
  cartoon: 'cartoon style, bright colors, simple shapes',
  oil: 'oil painting style, rich textures, vibrant colors',
  anime: 'anime style, Japanese animation, detailed characters',
  flat: 'flat illustration style, minimalist, clean lines',
  '3d': '3D rendered style, realistic lighting, depth',
};

/**
 * 清理 3 天前的已完成任务记录
 * 遵循 async-parallel 规则：在后台执行，不阻塞主流程
 */
async function cleanOldTasks(): Promise<void> {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = await sql`
      DELETE FROM tasks
      WHERE created_at < ${threeDaysAgo.toISOString()}
      RETURNING id
    `;
    if (result.rows.length > 0) {
      console.log(`[清理任务] 删除了 ${result.rows.length} 条 3 天前的旧任务记录`);
    }
  } catch (error) {
    // 清理失败不影响主流程，仅记录日志
    console.error('[清理任务] 失败:', (error as Error).message);
  }
}

function enhancePrompt(imagePrompt: string, style: string): string {
  const styleDesc = STYLE_PROMPTS[style] || STYLE_PROMPTS.watercolor;
  return `Children's book illustration, ${imagePrompt}, ${styleDesc}, safe for children, no text, high quality`;
}

/**
 * 注册图片生成路由
 */
export function registerImageRoutes(
  app: any,
  dependencies: {
    getUserFromRequest: (req: VercelRequest) => Promise<UserPayload | null>;
  }
) {
  const { getUserFromRequest } = dependencies;

  // ==================== 单张图片生成 ====================
  app.post('/api/create/image', async (req: VercelRequest, res: VercelResponse) => {
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

      if (!page.image_prompt) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROMPT',
            message: `第 ${pageNumber} 页缺少画面描述`,
          },
        });
      }

      // 使用智谱 GLM 生成图片
      const glmApiKey = process.env.GLM_API_KEY;
      if (!glmApiKey) {
        throw new Error('智谱 GLM API Key 未配置');
      }

      const enhancedPrompt = enhancePrompt(page.image_prompt, style);
      console.log(`[单张图片生成] 第 ${pageNumber} 页 prompt:`, enhancedPrompt.substring(0, 200));

      // 调用智谱 GLM API（添加超时控制）
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 50000);

      const model = process.env.GLM_IMAGE_MODEL || 'glm-image';
      const requestBody = {
        model,
        prompt: enhancedPrompt,
      };

      console.log('[单张图片生成] 请求体:', JSON.stringify(requestBody, null, 2));

      try {
        const imgResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${glmApiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        console.log('[单张图片生成] 响应状态:', imgResponse.status, imgResponse.statusText);

        if (!imgResponse.ok) {
          const errText = await imgResponse.text();
          console.error('[单张图片生成] API 错误详情:', errText);
          throw new Error(`智谱 GLM API 错误 (${imgResponse.status}): ${errText}`);
        }

        const imgResult = await imgResponse.json();
        console.log('[图片生成] API 返回响应:', JSON.stringify(imgResult).substring(0, 500));

        const originalImageUrl = imgResult.data?.[0]?.url || '';

        if (!originalImageUrl) {
          console.error('[图片生成] 无法提取图片 URL，响应键:', Object.keys(imgResult));
          throw new Error('智谱 GLM 未返回图片');
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
          }
        }

        return res.status(200).json({
          success: true,
          data: {
            pageNumber: pageNumber,
            imageUrl: finalImageUrl,
            provider: 'glm',
            model,
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
  });

  // ==================== 批量生成图片 ====================
  app.post('/api/create/images', async (req: VercelRequest, res: VercelResponse) => {
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
      // 后台清理 7 天前的旧任务记录（不等待完成，遵循 async-parallel 规则）
      cleanOldTasks().catch(() => {});

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
            generatedPages: [],
            forceRegenerate
          })}
        )
      `;

      // 尝试生成第一张图片（如果没有图片或需要强制重新生成）
      const firstPage = pages[0];
      if (!firstPage.image_url || forceRegenerate) {
        const oldImageUrl = firstPage.image_url;

        try {
          const glmApiKey = process.env.GLM_API_KEY;
          if (!glmApiKey) {
            throw new Error('智谱 GLM API Key 未配置');
          }

          if (!firstPage.image_prompt) {
            throw new Error('分镜页面缺少画面描述 (image_prompt)');
          }

          const enhancedPrompt = enhancePrompt(firstPage.image_prompt, style);
          console.log('生成图片 prompt:', enhancedPrompt.substring(0, 200));

          const model = process.env.GLM_IMAGE_MODEL || 'glm-image';
          const imgResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${glmApiKey}`,
            },
            body: JSON.stringify({
              model,
              prompt: enhancedPrompt,
            }),
          });

          if (!imgResponse.ok) {
            const errText = await imgResponse.text();
            throw new Error(`智谱 GLM API 错误: ${errText}`);
          }

          const imgResult = await imgResponse.json();
          const originalImageUrl = imgResult.data?.[0]?.url || '';

          if (!originalImageUrl) {
            throw new Error('智谱 GLM 未返回图片');
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
                  provider: 'glm',
                  pages: [{ pageNumber: 1, imageUrl }],
                  generatedPages: [{ pageNumber: 1, imageUrl }],
                  forceRegenerate,
                })},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${taskId}
          `;

          // 删除旧图片
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
          provider: provider || 'glm',
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
  });

  // ==================== 查询任务状态 ====================
  app.get(/^\/api\/create\/task\/([^/]+)$/, async (req: VercelRequest, res: VercelResponse, matches?: RegExpMatchArray) => {
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

    const taskId = matches?.[1] || '';

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
  });

  // ==================== 继续生成下一张图片 ====================
  app.post(/^\/api\/create\/task\/([^/]+)\/continue$/, async (req: VercelRequest, res: VercelResponse, matches?: RegExpMatchArray) => {
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

    const taskId = matches?.[1] || '';
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
        generatedPages: Array<{ pageNumber: number; imageUrl: string }>;
        forceRegenerate?: boolean;
      };

      if (!taskData.generatedPages) {
        taskData.generatedPages = [];
      }

      // 原子更新：completed_items + 1
      const updateResult = await sql`
        UPDATE tasks
        SET completed_items = completed_items + 1,
            progress = ROUND((completed_items + 1)::float / total_items * 100),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId} AND status = 'processing' AND completed_items < total_items
        RETURNING completed_items, total_items, status
      `;

      if (updateResult.rows.length === 0) {
        // 任务可能已完成
        return res.status(200).json({
          success: true,
          data: {
            taskId: task.id,
            status: 'completed',
            progress: 100,
            completedItems: task.total_items,
            totalItems: task.total_items,
            message: '所有图片生成完成',
            pages: taskData.pages,
            generatedPages: taskData.generatedPages,
          },
        });
      }

      const nextPageNumber = updateResult.rows[0].completed_items;
      const totalItems = updateResult.rows[0].total_items;
      const newProgress = Math.round((nextPageNumber / totalItems) * 100);

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
            totalItems: task.totalItems,
            message: '所有图片生成完成',
            pages: taskData.pages,
            generatedPages: taskData.generatedPages,
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
            totalItems: task.totalItems,
            message: '所有图片生成完成',
            pages: taskData.pages,
            generatedPages: taskData.generatedPages,
          },
        });
      }

      const page = pageResult.rows[0];
      const forceRegenerate = taskData.forceRegenerate || false;

      // 如果页面已有图片且不是强制重新生成，跳过
      if (page.image_url && !forceRegenerate) {
        const pageEntry = JSON.stringify({
          pageNumber: nextPageNumber,
          imageUrl: page.image_url,
        });

        await sql`
          UPDATE tasks
          SET result = jsonb_set(
            COALESCE(result, '{}'::jsonb),
            '{pages}',
            COALESCE(result->'pages', '[]'::jsonb) || ${pageEntry}::jsonb,
            true
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = ${taskId}
        `;

        const isCompleted = nextPageNumber >= totalItems;
        const finalStatus = isCompleted ? 'completed' : 'processing';

        if (isCompleted) {
          await sql`
            UPDATE tasks
            SET status = 'completed',
                progress = 100,
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
        }

        const updatedTask = await sql<{ result: any }[]>`
          SELECT result FROM tasks WHERE id = ${taskId}
        `;
        const updatedResult = updatedTask.rows[0].result as any;

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
            pages: updatedResult.pages || [],
            generatedPages: updatedResult.generatedPages || [],
          },
        });
      }

      const oldImageUrl = page.image_url;

      // 生成图片
      const glmApiKey = process.env.GLM_API_KEY;
      if (!glmApiKey) {
        throw new Error('智谱 GLM API Key 未配置');
      }

      if (!page.image_prompt) {
        throw new Error(`第 ${nextPageNumber} 页缺少画面描述 (image_prompt)`);
      }

      const enhancedPrompt = enhancePrompt(page.image_prompt, taskData.style);
      console.log(`[Continue 图片生成] 生成第 ${nextPageNumber} 页图片 prompt:`, enhancedPrompt.substring(0, 200));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 50000);

      try {
        const model = process.env.GLM_IMAGE_MODEL || 'glm-image';
        const requestBody = {
          model,
          prompt: enhancedPrompt,
        };

        console.log('[Continue 图片生成] 请求体:', JSON.stringify(requestBody, null, 2));

        const imgResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${glmApiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!imgResponse.ok) {
          const errText = await imgResponse.text();
          throw new Error(`智谱 GLM API 错误: ${errText}`);
        }

        const imgResult = await imgResponse.json();
        const originalImageUrl = imgResult.data?.[0]?.url || '';

        if (!originalImageUrl) {
          throw new Error('智谱 GLM 未返回图片');
        }

        // 上传图片到 Vercel Blob
        const blobFilename = `storybook/${taskData.workId || 'unknown'}/page-${nextPageNumber}-${Date.now()}.png`;
        const finalImageUrl = await uploadImageToBlob(originalImageUrl, blobFilename);

        const result = {
          imageUrl: finalImageUrl,
          provider: 'glm',
          model,
        };

        // 更新页面图片
        await sql`
          UPDATE storyboard_pages
          SET image_url = ${result.imageUrl}
          WHERE id = ${page.id}
        `;

        // 删除旧图片
        if (oldImageUrl && oldImageUrl.includes('vercel-storage.com')) {
          try {
            await del(oldImageUrl);
            console.log(`[Continue 图片生成] 已删除旧图片 (第${nextPageNumber}页): ${oldImageUrl.substring(0, 80)}...`);
          } catch (delError: any) {
            console.error(`[Continue 图片生成] 删除旧图片失败:`, delError.message);
          }
        }

        // 更新任务进度
        const isCompleted = nextPageNumber >= totalItems;
        const newPageEntry = JSON.stringify({
          pageNumber: nextPageNumber,
          imageUrl: result.imageUrl,
        });

        await sql`
          UPDATE tasks
          SET status = ${isCompleted ? 'completed' : 'processing'},
              result = jsonb_set(
                COALESCE(result, '{}'::jsonb),
                '{pages}',
                COALESCE(result->'pages', '[]'::jsonb) || ${newPageEntry}::jsonb,
                true
              ),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${taskId}
        `;

        await sql`
          UPDATE tasks
          SET result = jsonb_set(
            result,
            '{generatedPages}',
            COALESCE(result->'generatedPages', '[]'::jsonb) || ${newPageEntry}::jsonb,
            true
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = ${taskId}
        `;

        if (isCompleted && taskData.workId) {
          await sql`
            UPDATE works
            SET current_step = 'preview', updated_at = CURRENT_TIMESTAMP
            WHERE id = ${taskData.workId}
          `;
        }

        const updatedTask = await sql<{ result: any }[]>`
          SELECT result FROM tasks WHERE id = ${taskId}
        `;
        const updatedResult = updatedTask.rows[0].result as any;

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
            pages: updatedResult.pages || [],
            generatedPages: updatedResult.generatedPages || [],
          },
        });
      } catch (fetchError: any) {
        clearTimeout(timeout);
        const errorMessage = fetchError.name === 'AbortError'
          ? '图片生成超时，请重试'
          : `图片生成失败: ${fetchError.message}`;

        console.error(`生成第 ${nextPageNumber} 页图片失败:`, errorMessage);

        // 回滚 completed_items
        try {
          await sql`
            UPDATE tasks
            SET completed_items = completed_items - 1,
                progress = ROUND((completed_items - 1)::float / totalItems * 100),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${taskId}
          `;
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
  });
}
