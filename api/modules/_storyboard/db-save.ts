/**
 * 分镜数据库保存模块
 * 从 storyboard.ts 提取的数据库保存逻辑
 */

import { sql } from '@vercel/postgres';
import type { StoryboardPage } from './parser.js';

function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${randomStr}`;
}

/**
 * 保存分镜到数据库
 */
export async function saveStoryboardToDb(params: {
  workId: string;
  storyId: string | null;
  pages: StoryboardPage[];
}): Promise<{ storyboardId: string }> {
  const { workId, storyId, pages } = params;

  const storyboardId = generateId('sb');

  // 创建 storyboard 记录
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

  return { storyboardId };
}
