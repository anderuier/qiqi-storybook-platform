/**
 * 故事生成 Prompt 模板
 */

// 故事风格描述
export const STORY_STYLES: Record<string, string> = {
  warm: '温馨感人，充满爱与关怀',
  adventure: '冒险刺激，充满探索精神',
  funny: '幽默搞笑，轻松愉快',
  educational: '寓教于乐，传递知识和道理',
  fantasy: '奇幻梦幻，充满想象力',
  friendship: '关于友情，温暖治愈',
};

// 故事长度配置
export const STORY_LENGTH: Record<string, { min: number; max: number; pages: string }> = {
  short: { min: 200, max: 400, pages: '4-6' },
  medium: { min: 400, max: 800, pages: '6-10' },
  long: { min: 800, max: 1200, pages: '10-15' },
};

// 生成故事的 System Prompt
export function getStorySystemPrompt(): string {
  return `你是一位专业的儿童绘本故事作家，专门为3-6岁学龄前儿童创作故事。

你的创作原则：
1. 语言简单易懂，使用短句，避免复杂词汇
2. 故事情节生动有趣，有明确的开头、发展和结尾
3. 包含积极正面的主题和价值观
4. 适合亲子共读，有互动性
5. 角色形象鲜明可爱
6. 场景描写生动，便于后续配图

输出格式要求：
- 直接输出故事内容，不要包含标题
- 使用中文创作
- 段落之间用空行分隔
- 不要包含任何元信息或说明文字`;
}

// 生成故事的 User Prompt
export function getStoryUserPrompt(params: {
  childName: string;
  childAge: number;
  theme?: string;
  keywords?: string[];
  style: string;
  length: 'short' | 'medium' | 'long';
}): string {
  const { childName, childAge, theme, keywords, style, length } = params;
  const styleDesc = STORY_STYLES[style] || style;
  const lengthConfig = STORY_LENGTH[length];

  let prompt = `请为一个${childAge}岁的小朋友"${childName}"创作一个童话故事。

故事要求：
- 风格：${styleDesc}
- 字数：${lengthConfig.min}-${lengthConfig.max}字
- 主角名字：${childName}（让孩子成为故事的主角）`;

  if (theme) {
    prompt += `\n- 主题：${theme}`;
  }

  if (keywords && keywords.length > 0) {
    prompt += `\n- 关键元素：${keywords.join('、')}`;
  }

  prompt += `\n\n请开始创作故事：`;

  return prompt;
}

// 生成分镜剧本的 System Prompt
export function getStoryboardSystemPrompt(): string {
  return `你是一位专业的绘本分镜师，负责将完整的故事拆分成适合绘本展示的分镜剧本。

你的任务：
1. 将故事拆分成多个页面，每页包含一个场景
2. 为每页提供朗读文字（简短，适合朗读）
3. 为每页提供详细的画面描述（用于AI生成图片）

输出格式要求（JSON）：
{
  "pages": [
    {
      "pageNumber": 1,
      "text": "朗读文字（中文，简短）",
      "imagePrompt": "画面描述（英文，详细描述场景、角色、动作、表情、背景、氛围等，用于AI绘图）"
    }
  ]
}

画面描述要求：
- 使用英文，便于AI绘图模型理解
- 描述要具体详细，包括：角色外观、表情、动作、场景环境、光线氛围
- 保持角色形象一致性（描述主角的固定特征）
- 适合儿童绘本的可爱画风
- 每个场景独立完整`;
}

// 生成分镜剧本的 User Prompt
export function getStoryboardUserPrompt(
  story: string,
  pageCount?: number
): string {
  let prompt = `请将以下故事拆分成绘本分镜剧本：

---
${story}
---

`;

  if (pageCount) {
    prompt += `要求拆分成 ${pageCount} 页。`;
  } else {
    prompt += `请根据故事内容自动决定合适的页数（通常4-12页）。`;
  }

  prompt += `\n\n请输出 JSON 格式的分镜剧本：`;

  return prompt;
}
