/**
 * 图片生成服务封装
 * 支持多种图片生成提供商：DALL-E、Stability、Google Imagen、即梦、自定义接口
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 图片生成提供商类型
export type ImageProvider = 'dalle' | 'stability' | 'imagen' | 'jimeng' | 'custom';

// 获取当前使用的图片生成提供商
export function getImageProvider(): ImageProvider {
  return (process.env.IMAGE_PROVIDER as ImageProvider) || 'dalle';
}

// ============================================
// DALL-E 客户端（使用 OpenAI SDK）
// ============================================
let dalleClient: OpenAI | null = null;
function getDalleClient(): OpenAI {
  if (!dalleClient) {
    dalleClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return dalleClient;
}

// ============================================
// Google Imagen 客户端
// ============================================
let imagenClient: GoogleGenerativeAI | null = null;
function getImagenClient(): GoogleGenerativeAI {
  if (!imagenClient) {
    imagenClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  }
  return imagenClient;
}

// ============================================
// 自定义图片生成客户端
// ============================================
let customImageClient: OpenAI | null = null;
function getCustomImageClient(): OpenAI {
  if (!customImageClient) {
    customImageClient = new OpenAI({
      apiKey: process.env.CUSTOM_IMAGE_API_KEY,
      baseURL: process.env.CUSTOM_IMAGE_API_BASE_URL,
    });
  }
  return customImageClient;
}

// 图片尺寸选项
export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792' | '512x512' | '256x256';

// 图片风格选项
export type ImageStyle = 'vivid' | 'natural';

// 图片生成选项
export interface ImageGenerateOptions {
  prompt: string;
  size?: ImageSize;
  style?: ImageStyle;
  quality?: 'standard' | 'hd';
  provider?: ImageProvider;
  model?: string;
  n?: number; // 生成数量
  negativePrompt?: string; // 负面提示词
}

// 图片生成结果
export interface ImageGenerateResult {
  imageUrl: string;
  revisedPrompt?: string;
  provider: ImageProvider;
  model: string;
}

/**
 * 生成图片
 */
export async function generateImage(
  options: ImageGenerateOptions
): Promise<ImageGenerateResult> {
  const provider = options.provider || getImageProvider();

  switch (provider) {
    case 'dalle':
      return generateWithDalle(options);
    case 'stability':
      return generateWithStability(options);
    case 'imagen':
      return generateWithImagen(options);
    case 'jimeng':
      return generateWithJimeng(options);
    case 'custom':
      return generateWithCustomImage(options);
    default:
      throw new Error(`不支持的图片生成��供商: ${provider}`);
  }
}

/**
 * 使用 DALL-E 生成图片
 */
async function generateWithDalle(
  options: ImageGenerateOptions
): Promise<ImageGenerateResult> {
  const client = getDalleClient();
  const model = options.model || process.env.DALLE_MODEL || 'dall-e-3';

  const response = await client.images.generate({
    model,
    prompt: options.prompt,
    size: options.size || '1024x1024',
    style: options.style || 'vivid',
    quality: options.quality || 'standard',
    n: 1,
  });

  const image = response.data?.[0];

  return {
    imageUrl: image?.url || '',
    revisedPrompt: image?.revised_prompt,
    provider: 'dalle',
    model,
  };
}

/**
 * 使用 Stability AI (Stable Diffusion) 生成图片
 */
async function generateWithStability(
  options: ImageGenerateOptions
): Promise<ImageGenerateResult> {
  const apiKey = process.env.STABILITY_API_KEY;
  const model = options.model || process.env.STABILITY_MODEL || 'stable-diffusion-xl-1024-v1-0';

  // 解析尺寸
  const [width, height] = (options.size || '1024x1024').split('x').map(Number);

  const response = await fetch(
    `https://api.stability.ai/v1/generation/${model}/text-to-image`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: options.prompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        width,
        height,
        samples: 1,
        steps: 30,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stability AI 错误: ${error}`);
  }

  const result = await response.json();
  const image = result.artifacts[0];

  // Stability AI 返回 base64，需要上传到存储服务
  // 这里暂时返回 data URL，实际使用时应上传到云存储
  const imageUrl = `data:image/png;base64,${image.base64}`;

  return {
    imageUrl,
    provider: 'stability',
    model,
  };
}

/**
 * 使用 Google Imagen 生成图片
 * 文档：https://ai.google.dev/gemini-api/docs/imagen
 */
async function generateWithImagen(
  options: ImageGenerateOptions
): Promise<ImageGenerateResult> {
  const client = getImagenClient();
  const model = options.model || process.env.IMAGEN_MODEL || 'imagen-3.0-generate-002';

  // 使用 Gemini API 的图片生成功能
  const imageModel = client.getGenerativeModel({ model });

  const response = await imageModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: options.prompt }],
      },
    ],
    generationConfig: {
      // Imagen 特定配置
      responseMimeType: 'image/png',
    } as any,
  });

  // 注意：Google Imagen API 的响应格式可能需要根据实际情况调整
  // 这里是基于文档的预期格式
  const result = response.response;

  // 如果返回的是 base64 图片数据
  const imageData = result.candidates?.[0]?.content?.parts?.[0];

  let imageUrl = '';
  if (imageData && 'inlineData' in imageData && imageData.inlineData) {
    imageUrl = `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`;
  }

  return {
    imageUrl,
    provider: 'imagen',
    model,
  };
}

/**
 * 使用即梦 (Jimeng) 生成图片
 * 字节跳动旗下的 AI 图片生成服务，基于火山引擎
 * 文档：https://www.volcengine.com/docs/6791/1347773
 *
 * 即梦支持两种模式：
 * 1. 同步模式（OpenAI 兼容格式）- 适用于第三方代理
 * 2. 异步模式（火山引擎原生格式）- 官方 API
 */
async function generateWithJimeng(
  options: ImageGenerateOptions
): Promise<ImageGenerateResult> {
  const apiMode = process.env.JIMENG_API_MODE || 'sync'; // sync | async

  if (apiMode === 'async') {
    return generateWithJimengAsync(options);
  }

  return generateWithJimengSync(options);
}

/**
 * 即梦同步模式 - OpenAI 兼容格式
 * 适用于第三方代理服务
 */
async function generateWithJimengSync(
  options: ImageGenerateOptions
): Promise<ImageGenerateResult> {
  const apiKey = process.env.JIMENG_API_KEY;
  const baseUrl = process.env.JIMENG_API_BASE_URL || 'https://api.jimeng.ai/v1';
  const model = options.model || process.env.JIMENG_MODEL || 'jimeng-2.1';

  // 解析尺寸
  const [width, height] = (options.size || '1024x1024').split('x').map(Number);

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: options.prompt,
      negative_prompt: options.negativePrompt || getChildrenBookNegativePrompt(),
      width,
      height,
      n: options.n || 1,
      // 即梦特有参数
      seed: -1, // 随机种子，-1 表示随机
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`即梦 API 错误: ${error}`);
  }

  const result = await response.json();

  // 即梦返回格式
  const imageUrl = result.data?.[0]?.url || result.images?.[0]?.url || '';

  return {
    imageUrl,
    provider: 'jimeng',
    model,
  };
}

/**
 * 即梦异步模式 - 火山引擎原生格式
 * 官方 API，使用 AK/SK 签名认证
 * 文档：https://www.volcengine.com/docs/6791/1347773
 */
async function generateWithJimengAsync(
  options: ImageGenerateOptions
): Promise<ImageGenerateResult> {
  const accessKey = process.env.JIMENG_ACCESS_KEY;
  const secretKey = process.env.JIMENG_SECRET_KEY;
  const model = options.model || process.env.JIMENG_MODEL || 'general_v2.1_L';

  if (!accessKey || !secretKey) {
    throw new Error('即梦异步模式需要配置 JIMENG_ACCESS_KEY 和 JIMENG_SECRET_KEY');
  }

  // 解析尺寸
  const [width, height] = (options.size || '1024x1024').split('x').map(Number);

  // 请求体 - 使用即梦文生图 API
  const requestBody = {
    req_key: 'jimeng_high_aes_general_v21',
    prompt: options.prompt,
    model_version: model,
    width,
    height,
    seed: -1,
    scale: 3.5,
    ddim_steps: 25,
    use_sr: true,
    return_url: true,
    logo_info: {
      add_logo: false,
    },
  };

  console.log('即梦请求参数:', JSON.stringify(requestBody, null, 2));

  // 发送请求
  const result = await volcengineRequest({
    accessKey,
    secretKey,
    service: 'cv',  // 使用 cv 服务
    region: 'cn-north-1',
    action: 'CVProcess',
    version: '2022-08-31',
    body: requestBody,
  });

  console.log('即梦响应:', JSON.stringify(result, null, 2));

  // 检查响应 - 火山引擎返回格式
  if (result.ResponseMetadata?.Error) {
    const error = result.ResponseMetadata.Error;
    throw new Error(`即梦图片生成失败: ${error.Code} - ${error.Message}`);
  }

  // 检查业务响应码
  if (result.code && result.code !== 10000) {
    throw new Error(`即梦图片生成失败: ${result.message || JSON.stringify(result)}`);
  }

  // 如果直接返回了图片 URL
  const imageUrls = result.data?.image_urls || result.Result?.data?.image_urls;
  if (imageUrls?.[0]) {
    return {
      imageUrl: imageUrls[0],
      provider: 'jimeng',
      model,
    };
  }

  // 如果返回了 binary_data_base64（base64 编码的图片）
  const binaryData = result.data?.binary_data_base64 || result.Result?.data?.binary_data_base64;
  if (binaryData?.[0]) {
    return {
      imageUrl: `data:image/png;base64,${binaryData[0]}`,
      provider: 'jimeng',
      model,
    };
  }

  throw new Error(`即梦未返回图片数据: ${JSON.stringify(result)}`);
}

/**
 * 火山引擎 API 请求封装
 * 实现 HMAC-SHA256 签名认证
 */
interface VolcengineRequestOptions {
  accessKey: string;
  secretKey: string;
  service: string;
  region: string;
  action: string;
  version: string;
  body: Record<string, any>;
}

async function volcengineRequest(options: VolcengineRequestOptions): Promise<any> {
  const { accessKey, secretKey, service, region, action, version, body } = options;

  // 火山引擎 CV 服务使用 visual.volcengineapi.com 域名
  const host = service === 'cv' ? 'visual.volcengineapi.com' : `${service}.volcengineapi.com`;
  const url = `https://${host}/`;
  const method = 'POST';
  const contentType = 'application/json';

  // 当前时间 - 使用 UTC 时间
  const now = new Date();
  const xDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const shortDate = xDate.substring(0, 8);

  // 请求体
  const bodyString = JSON.stringify(body);

  // 计算请求体哈希
  const crypto = await import('crypto');
  const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');

  // 规范请求头 - 按字母顺序排列
  const signedHeaders = 'content-type;host;x-content-sha256;x-date';
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-content-sha256:${bodyHash}`,
    `x-date:${xDate}`,
  ].join('\n');

  // 规范查询字符串 - 按字母顺序排列
  const queryParams = new URLSearchParams();
  queryParams.set('Action', action);
  queryParams.set('Version', version);
  queryParams.sort();
  const canonicalQueryString = queryParams.toString();

  // 规范请求
  const canonicalRequest = [
    method,
    '/',
    canonicalQueryString,
    canonicalHeaders + '\n',
    signedHeaders,
    bodyHash,
  ].join('\n');

  // 计算规范请求哈希
  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

  // 凭证范围
  const credentialScope = `${shortDate}/${region}/${service}/request`;

  // 待签名字符串
  const stringToSign = [
    'HMAC-SHA256',
    xDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  // 计算签名密钥
  const kDate = crypto.createHmac('sha256', secretKey).update(shortDate).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('request').digest();

  // 计算签名
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  // 构建 Authorization 头
  const authorization = `HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  console.log('火山引擎请求 URL:', `${url}?${canonicalQueryString}`);
  console.log('火山引擎请求头 X-Date:', xDate);

  // 发送请求
  const response = await fetch(`${url}?${canonicalQueryString}`, {
    method,
    headers: {
      'Content-Type': contentType,
      'Host': host,
      'X-Date': xDate,
      'X-Content-Sha256': bodyHash,
      'Authorization': authorization,
    },
    body: bodyString,
  });

  const responseText = await response.text();
  console.log('火山引擎响应状态:', response.status);
  console.log('火山引擎响应内容:', responseText);

  if (!response.ok) {
    throw new Error(`火山引擎 API 请求失败 (${response.status}): ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`火山引擎响应解析失败: ${responseText}`);
  }
}

/**
 * 生成火山引擎 API 签名（已废弃，使用 volcengineRequest 代替）
 */
function generateVolcengineAuth(
  accessKey: string,
  secretKey: string,
  service: string,
  action: string
): string {
  // 此函数已废弃，保留仅为兼容性
  return `Bearer ${accessKey}`;
}

/**
 * 使用自定义图片生成接口
 * 支持兼容 OpenAI 图片生成 API 格式的服务
 */
async function generateWithCustomImage(
  options: ImageGenerateOptions
): Promise<ImageGenerateResult> {
  const client = getCustomImageClient();
  const model = options.model || process.env.CUSTOM_IMAGE_MODEL || 'default';

  const response = await client.images.generate({
    model,
    prompt: options.prompt,
    size: options.size || '1024x1024',
    n: 1,
  });

  const image = response.data?.[0];

  return {
    imageUrl: image?.url || '',
    revisedPrompt: image?.revised_prompt,
    provider: 'custom',
    model,
  };
}

// ============================================
// 预设的图片生成服务配置
// ============================================
export const PRESET_IMAGE_SERVICES = {
  // OpenAI DALL-E
  dalle: {
    name: 'OpenAI DALL-E',
    models: ['dall-e-3', 'dall-e-2'],
    sizes: ['1024x1024', '1792x1024', '1024x1792'],
    website: 'https://platform.openai.com/',
  },
  // Stability AI
  stability: {
    name: 'Stability AI',
    models: ['stable-diffusion-xl-1024-v1-0', 'stable-diffusion-v1-6'],
    sizes: ['1024x1024', '512x512'],
    website: 'https://platform.stability.ai/',
  },
  // Google Imagen
  imagen: {
    name: 'Google Imagen',
    models: ['imagen-3.0-generate-002', 'imagen-3.0-generate-001'],
    sizes: ['1024x1024', '1536x1536'],
    website: 'https://ai.google.dev/',
  },
  // 即梦 Jimeng（字节跳动/火山引擎）
  jimeng: {
    name: '即梦 (字节跳动)',
    models: ['jimeng-2.1', 'jimeng-2.0', 'general_v2.1_L', 'general_v2.0'],
    sizes: ['1024x1024', '1280x720', '720x1280', '512x512'],
    website: 'https://www.jimeng.ai/',
    docs: 'https://www.volcengine.com/docs/6791/1347773',
    envVars: {
      sync: ['JIMENG_API_KEY', 'JIMENG_API_BASE_URL', 'JIMENG_MODEL'],
      async: ['JIMENG_ACCESS_KEY', 'JIMENG_SECRET_KEY', 'JIMENG_API_BASE_URL', 'JIMENG_MODEL'],
    },
    modes: ['sync', 'async'],
    defaultMode: 'sync',
  },
  // 硅基流动 SiliconFlow
  siliconflow: {
    name: '硅基流动 SiliconFlow',
    baseURL: 'https://api.siliconflow.cn/v1',
    models: ['black-forest-labs/FLUX.1-schnell', 'stabilityai/stable-diffusion-3-medium'],
    website: 'https://siliconflow.cn/',
  },
  // 通义万相
  wanx: {
    name: '通义万相 (阿里)',
    baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
    models: ['wanx-v1'],
    website: 'https://tongyi.aliyun.com/wanxiang',
  },
};

// ============================================
// 儿童绘本专用 Prompt 增强
// ============================================
export function enhancePromptForChildrenBook(
  prompt: string,
  style: string = 'watercolor'
): string {
  const styleDescriptions: Record<string, string> = {
    watercolor: 'soft watercolor illustration style, gentle colors, dreamy atmosphere',
    cartoon: 'cute cartoon style, bright colors, simple shapes, child-friendly',
    oil: 'oil painting style, rich textures, warm colors',
    anime: 'anime illustration style, big expressive eyes, vibrant colors',
    flat: 'flat illustration style, minimalist, modern, clean lines',
    '3d': '3D rendered style, soft lighting, rounded shapes, Pixar-like',
  };

  const styleDesc = styleDescriptions[style] || styleDescriptions.watercolor;

  return `${prompt}, ${styleDesc}, children's book illustration, safe for children, no text, high quality, detailed`;
}

// ============================================
// 儿童绘本专用负面提示词
// ============================================
export function getChildrenBookNegativePrompt(): string {
  return 'scary, horror, violence, blood, weapon, nsfw, adult content, text, watermark, signature, low quality, blurry, distorted';
}
