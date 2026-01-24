import { ImageProvider } from "@/lib/api";
import {
  Wand2,
  ScrollText,
  FileText,
  Volume2,
  Mic2,
} from "lucide-react";

/**
 * 创作模式选项
 */
export const createModes = [
  {
    id: "theme",
    icon: Wand2,
    title: "主题故事",
    description: "输入一个主题，AI为您生成完整的童话故事",
    example: "例如：小兔子的森林冒险、勇敢的小消防员",
    color: "coral"
  },
  {
    id: "poem",
    icon: ScrollText,
    title: "古诗词改编",
    description: "选择一首古诗词，AI将其改编成有趣的儿童故事",
    example: "例如：静夜思、春晓、咏鹅",
    color: "mint"
  },
  {
    id: "custom",
    icon: FileText,
    title: "自定义文本",
    description: "输入您自己的故事文本，AI为其生成精美插图",
    example: "适合已有故事内容的家长",
    color: "sunny"
  }
] as const;

/**
 * 艺术风格选项
 */
export const artStyles = [
  { id: "watercolor", name: "水彩手绘", image: "/images/demo-book.webp" },
  { id: "cartoon", name: "卡通动漫", image: "/images/demo-book.webp" },
  { id: "flat", name: "扁平插画", image: "/images/demo-book.webp" },
  { id: "3d", name: "3D渲染", image: "/images/demo-book.webp" },
  { id: "anime", name: "动漫风格", image: "/images/demo-book.webp" },
  { id: "oil", name: "油画风格", image: "/images/demo-book.webp" },
] as const;

/**
 * 故事风格选项
 */
export const storyStyles = [
  { id: "warm", name: "温馨感人" },
  { id: "adventure", name: "冒险刺激" },
  { id: "funny", name: "幽默搞笑" },
  { id: "educational", name: "寓教于乐" },
  { id: "fantasy", name: "奇幻梦幻" },
  { id: "friendship", name: "友情故事" },
] as const;

/**
 * 语音选项
 */
export const voiceOptions = [
  { id: "female_gentle", name: "温柔女声", description: "甜美温柔的女性配音", icon: Volume2 },
  { id: "female_lively", name: "活泼女声", description: "活泼开朗的女性配音", icon: Volume2 },
  { id: "male_warm", name: "温暖男声", description: "温暖亲切的男性配音", icon: Volume2 },
  { id: "child_cute", name: "童声朗读", description: "活泼可爱的儿童配音", icon: Volume2 },
  { id: "clone", name: "克隆我的声音", description: "上传30秒录音，AI克隆您的声音", icon: Mic2 },
] as const;

/**
 * 图片生成提供商选项
 */
export const imageProviders: Array<{
  id: ImageProvider;
  name: string;
  description: string;
  recommended?: boolean;
}> = [
  { id: "siliconflow", name: "硅基流动", description: "国内服务，免费额度，FLUX 模型", recommended: true },
  { id: "imagen", name: "Google Imagen", description: "Google AI 图片生成" },
  { id: "dalle", name: "DALL-E", description: "OpenAI 出品" },
  { id: "stability", name: "Stability AI", description: "Stable Diffusion 官方" },
  { id: "jimeng", name: "即梦", description: "字节跳动旗下" },
  { id: "custom", name: "自定义", description: "使用自定义 API" },
];

/**
 * 步骤标签
 */
export const stepLabels = ["输入", "故事", "分镜", "图片", "绘本", "配音"] as const;

/**
 * 总步骤数
 */
export const totalSteps = 6;
