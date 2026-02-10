/**
 * 故事数据库保存模块
 * 从 story.ts 提取的数据库保存逻辑
 */

import { sql } from '@vercel/postgres';

function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${randomStr}`;
}

/**
 * 从故事内容中提取标题
 */
export function extractTitle(storyContent: string): string {
  const firstLine = storyContent.split('\n')[0].replace(/^[#\s*]+/, '').trim();
  return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine || '我的童话故事';
}

/**
 * 保存故事到数据库（带 3 次重试）
 * 支持：1. 创建新草稿 2. 更新已存在草稿（重新生成故事）
 */
export async function saveStoryToDb(params: {
  userId: string;
  workId?: string | null;  // 如果提供，则更新已存在的草稿
  storyContent: string;
  theme: string;
  childName?: string;
  childAge?: number;
  childGender?: string;
  style?: string;
}): Promise<{ storyId: string; workId: string; title: string }> {
  const { userId, workId: existingWorkId, storyContent, theme, childName, childAge, childGender, style } = params;

  const storyId = generateId('story');
  const title = extractTitle(storyContent);

  let dbSaveSuccess = false;
  let dbError: unknown = null;
  let finalWorkId = existingWorkId || null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (existingWorkId) {
        // 更新已存在的草稿
        // 1. 更新 work 信息
        await sql`
          UPDATE works
          SET title = ${title},
              theme = ${theme},
              child_name = ${childName || null},
              child_age = ${childAge || null},
              child_gender = ${childGender || null},
              style = ${style || null},
              current_step = 'story',
              updated_at = NOW()
          WHERE id = ${existingWorkId}
        `;

        // 2. 删除旧的 story 记录（重新生成）
        await sql`
          DELETE FROM stories WHERE work_id = ${existingWorkId}
        `;

        // 3. 插入新的 story 记录
        await sql`
          INSERT INTO stories (id, work_id, content, word_count)
          VALUES (${storyId}, ${existingWorkId}, ${storyContent}, ${storyContent.length})
        `;

        finalWorkId = existingWorkId;
        console.log('[故事保存] 更新已存在草稿 workId:', existingWorkId);
      } else {
        // 创建新草稿
        const newWorkId = generateId('work');
        await sql`
          INSERT INTO works (id, user_id, title, status, current_step, theme, child_name, child_age, child_gender, style)
          VALUES (${newWorkId}, ${userId}, ${title}, 'draft', 'story', ${theme}, ${childName || null}, ${childAge || null}, ${childGender || null}, ${style || null})
        `;

        await sql`
          INSERT INTO stories (id, work_id, content, word_count)
          VALUES (${storyId}, ${newWorkId}, ${storyContent}, ${storyContent.length})
        `;

        finalWorkId = newWorkId;
        console.log('[故事保存] 创建新草稿 workId:', newWorkId);
      }

      dbSaveSuccess = true;
      break;
    } catch (err) {
      dbError = err;
      console.error(`[故事保存] 第 ${attempt} 次尝试失败:`, err);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  if (!dbSaveSuccess) {
    throw dbError;
  }

  return { storyId, workId: finalWorkId!, title };
}
