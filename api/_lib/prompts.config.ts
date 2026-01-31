/**
 * AI Prompt 配置文件
 *
 * 本文件集中管理所有 AI 生成功能的提示词配置
 * 修改此文件可以调整 AI 生成内容的风格和质量
 *
 * 使用说明：
 * 1. 每个 prompt 都有详细的注释说明其用途
 * 2. 修改后需要重新部署才能生效
 * 3. 可以使用 {变量名} 格式的占位符，在代码中动态替换
 */

// ============================================
// 故事生成 Prompt
// ============================================

/**
 * 故事生成 - 系统提示词
 *
 * 用途：定义 AI 作为儿童故事作家的角色和创作规范
 * 调用位置：/api/create/story
 */
export const STORY_SYSTEM_PROMPT = `你是一位专业的儿童故事作家，擅长为3-6岁学龄前儿童创作温馨、有趣、富有教育意义的童话故事。

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

/**
 * 故事生成 - 用户提示词模板
 *
 * 用途：根据用户输入构建具体的创作要求
 * 占位符说明：
 * - {theme}: 故事主题
 * - {childName}: 孩子名字（可选）
 * - {childAge}: 孩子年龄（可选）
 * - {style}: 故事风格（可选）
 * - {length}: 故事长度（可选）
 */
export const STORY_USER_PROMPT_TEMPLATE = `请为我创作一个关于"{theme}"的童话故事。`;

// 故事风格映射
export const STORY_STYLE_MAP: Record<string, string> = {
  warm: '温馨感人，充满爱与关怀',
  adventure: '冒险刺激，充满探索精神',
  funny: '幽默搞笑，轻松愉快',
  educational: '寓教于乐，包含知识点',
  fantasy: '奇幻魔法，充满想象力',
  friendship: '友情主题，强调友谊的珍贵',
};

// 故事长度映射
export const STORY_LENGTH_MAP: Record<string, string> = {
  short: '简短的故事，约300-500字，适合睡前快速阅读',
  medium: '中等长度的故事，约500-800字，情节完整',
  long: '较长的故事，约800-1200字，情节丰富有层次',
};

// ============================================
// 分镜剧本生成 Prompt
// ============================================

/**
 * 分镜生成 - 系统提示词
 *
 * 用途：将故事拆分成适合绘本的分镜页面
 * 调用位置：/api/create/storyboard
 */
export const STORYBOARD_SYSTEM_PROMPT = `你是一位专业的绘本分镜师，擅长将儿童故事转化为适合绘本呈现的分镜剧本。

分镜要求：
1. 每一页应该是一个完整的场景或情节片段
2. 每页文字控制在30-50字，适合幼儿阅读
3. 为每页提供详细的画面描述，用于后续图片生成
4. 画面描述要具体、生动，包含场景、人物、动作、表情、色彩等细节
5. 画面描述的语言与故事内容保持一致（中文故事用中文描述）

输出格式（严格按照以下格式，每页用分隔线隔开）：

---第1页---
文字：[这一页的故事文字]
画面：[详细的画面描述]

---第2页---
文字：[这一页的故事文字]
画面：[详细的画面描述]

以此类推...`;

/**
 * 分镜生成 - 用户提示词模板
 */
export const STORYBOARD_USER_PROMPT_TEMPLATE = `请将以下故事转化为{pageCount}页的绘本分镜。

故事内容：
{storyContent}

请按照格式输出{pageCount}页分镜，每页包含"文字"和"画面"两部分。`;

// 分镜解析正则表达式
export const STORYBOARD_PAGE_SEPARATOR_REGEX = /[-=]{2,}第\s*\d+\s*页[-=]{2,}|【第\s*\d+\s*页】|第\s*\d+\s*页[：:]/i;
export const STORYBOARD_LOOSE_SEPARATOR_REGEX = /第\s*(\d+)\s*页/;
export const STORYBOARD_TEXT_REGEX = /(?:故事)?文字[：:]\s*([\s\S]+?)(?=(?:画面|场景|图片)[：:]|$)/;
export const STORYBOARD_IMAGE_REGEX = /(?:画面|场景|图片)(?:描述)?[：:]\s*([\s\S]+?)?$/;

// ============================================
// 图片生成 Prompt
// ============================================

/**
 * 图片生成 - 提示词前缀
 *
 * 用途：为所有绘本图片添加统一的风格描述
 * 调用位置：/api/create/image
 */
export const IMAGE_PROMPT_PREFIX = `儿童绘本插画风格，温馨可爱，色彩明亮柔和，适合幼儿，`;

/**
 * 图片生成 - 提示词后缀
 *
 * 用途：添加通用的质量和风格要求
 */
export const IMAGE_PROMPT_SUFFIX = `，高质量，细节丰富，无文字，安全适合儿童`;

// 图片风格映射
export const IMAGE_STYLE_MAP: Record<string, string> = {
  watercolor: '水彩画风格，柔和的色彩过渡，梦幻感',
  cartoon: '卡通风格，线条清晰，色彩鲜艳',
  flat: '扁平插画风格，简洁现代，几何形状',
  '3d': '3D渲染风格，立体可爱，皮克斯动画感',
  handdrawn: '手绘风格，温暖质朴，有手工感',
  japanese: '日系绘本风格，清新淡雅，细腻温柔',
  oil: '油画风格，丰富纹理，鲜艳色彩',
  anime: '动漫风格，日本动画，精致角色',
};

// ============================================
// 故事改编 Prompt（古诗词改编等）
// ============================================

/**
 * 古诗词改编 - 系统提示词
 *
 * 用途：将古诗词改编成儿童故事
 * 调用位置：/api/create/story (mode: 'poem')
 */
export const POEM_ADAPTATION_SYSTEM_PROMPT = `你是一位擅长将中国古诗词改编成儿童故事的作家。

改编要求：
1. 保留原诗的意境和核心意象
2. 用通俗易懂的语言讲述诗中的故事
3. 可以适当扩展情节，但要符合原诗意境
4. 加入适合儿童理解的细节和对话
5. 在故事结尾自然地引出原诗
6. 帮助孩子理解诗词的含义和美感`;

// ============================================
// 语音生成 Prompt（预留）
// ============================================

/**
 * 语音生成 - 旁白风格描述
 *
 * 用途：指导语音合成的风格
 * 调用位置：/api/create/audio
 */
export const NARRATION_STYLE = {
  gentle: '温柔舒缓，像妈妈讲故事',
  lively: '活泼生动，富有表现力',
  calm: '平静安详，适合睡前故事',
};

// ============================================
// 辅助函数
// ============================================

/**
 * 构建故事生成的用户提示词
 */
export function buildStoryUserPrompt(params: {
  theme: string;
  childName?: string;
  childAge?: number;
  style?: string;
  length?: string;
}): string {
  const { theme, childName, childAge, style, length } = params;

  let prompt = `请为我创作一个关于"${theme}"的童话故事。`;

  if (childName) {
    prompt += `\n主角名字叫"${childName}"。`;
  }

  if (childAge) {
    prompt += `\n故事适合${childAge}岁的孩子阅读。`;
  }

  if (style && STORY_STYLE_MAP[style]) {
    prompt += `\n故事风格要求：${STORY_STYLE_MAP[style]}。`;
  }

  if (length && STORY_LENGTH_MAP[length]) {
    prompt += `\n故事长度要求：${STORY_LENGTH_MAP[length]}。`;
  }

  return prompt;
}

/**
 * 构建图片生成的完整提示词
 */
export function buildImagePrompt(
  sceneDescription: string,
  style?: string
): string {
  const styleDesc = style && IMAGE_STYLE_MAP[style]
    ? IMAGE_STYLE_MAP[style] + '，'
    : '';

  return `${IMAGE_PROMPT_PREFIX}${styleDesc}${sceneDescription}${IMAGE_PROMPT_SUFFIX}`;
}

/**
 * 构建分镜生成的用户提示词
 */
export function buildStoryboardUserPrompt(
  storyContent: string,
  pageCount: number = 6
): string {
  return STORYBOARD_USER_PROMPT_TEMPLATE
    .replace(/{pageCount}/g, String(pageCount))
    .replace('{storyContent}', storyContent);
}
