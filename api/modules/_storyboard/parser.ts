/**
 * 分镜文本解析器
 * 从 storyboard.ts 提取的解析逻辑
 */

import {
  STORYBOARD_PAGE_SEPARATOR_REGEX,
  STORYBOARD_LOOSE_SEPARATOR_REGEX,
  STORYBOARD_TEXT_REGEX,
  STORYBOARD_IMAGE_REGEX,
} from '../../_lib/prompts.config.js';

export interface StoryboardPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
}

/**
 * 解析分镜文本为结构化数据
 */
export function parseStoryboardText(text: string): StoryboardPage[] {
  const pages: StoryboardPage[] = [];

  // 更健壮的分隔符匹配：支持各种变体格式
  const sections = text.split(STORYBOARD_PAGE_SEPARATOR_REGEX).filter(s => s.trim());

  // 如果上面的分割没有结果，尝试更宽松的匹配
  if (sections.length === 0) {
    const looseSections = text.split(STORYBOARD_LOOSE_SEPARATOR_REGEX).filter(s => s.trim() && isNaN(Number(s)));
    if (looseSections.length > 0) {
      sections.push(...looseSections);
    }
  }

  sections.forEach((section, index) => {
    const textMatch = section.match(STORYBOARD_TEXT_REGEX);
    const imageMatch = section.match(STORYBOARD_IMAGE_REGEX);

    if (textMatch || imageMatch) {
      pages.push({
        pageNumber: index + 1,
        text: textMatch ? textMatch[1].trim() : '',
        imagePrompt: imageMatch ? imageMatch[1].trim() : '',
      });
    }
  });

  return pages;
}
