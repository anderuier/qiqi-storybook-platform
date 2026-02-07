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
 */
export async function saveStoryToDb(params: {
  userId: string;
  storyContent: string;
  theme: string;
  childName?: string;
  childAge?: number;
  childGender?: string;
  style?: string;
}): Promise<{ storyId: string; workId: string; title: string }> {
  const { userId, storyContent, theme, childName, childAge, childGender, style } = params;

  const storyId = generateId('story');
  const workId = generateId('work');
  const title = extractTitle(storyContent);

  let dbSaveSuccess = false;
  let dbError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await sql`
        INSERT INTO works (id, user_id, title, status, current_step, theme, child_name, child_age, child_gender, style)
        VALUES (${workId}, ${userId}, ${title}, 'draft', 'story', ${theme}, ${childName || null}, ${childAge || null}, ${childGender || null}, ${style || null})
      `;

      await sql`
        INSERT INTO stories (id, work_id, content, word_count)
        VALUES (${storyId}, ${workId}, ${storyContent}, ${storyContent.length})
      `;

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

  return { storyId, workId, title };
}
