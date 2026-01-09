/**
 * AI 服务封装
 * 支持多种 AI 提供商：Claude、OpenAI、Google Gemini、自定义兼容接口
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// AI 服务提供商类型
export type AIProvider = 'claude' | 'openai' | 'gemini' | 'custom';

// 获取当前使用的 AI 提供商
export function getAIProvider(): AIProvider {
  return (process.env.AI_PROVIDER as AIProvider) || 'claude';
}

// ============================================
// Claude 客户端
// ============================================
let claudeClient: Anthropic | null = null;
function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    claudeClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return claudeClient;
}

// ============================================
// OpenAI 客户端
// ============================================
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============================================
// Google Gemini 客户端
// ============================================
let geminiClient: GoogleGenerativeAI | null = null;
function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  }
  return geminiClient;
}

// ============================================
// 自定义 OpenAI 兼容接口客户端
// 支持国内各种 AI 服务（通义千问、文心一言、智谱、Kimi、DeepSeek 等）
// ============================================
let customClient: OpenAI | null = null;
function getCustomClient(): OpenAI {
  if (!customClient) {
    customClient = new OpenAI({
      apiKey: process.env.CUSTOM_API_KEY,
      baseURL: process.env.CUSTOM_API_BASE_URL,
    });
  }
  return customClient;
}

// 通用消息接口
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// AI 生成选项
export interface AIGenerateOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  provider?: AIProvider;
  model?: string; // 可选：指定具体模型
}

// AI 生成结果
export interface AIGenerateResult {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * 调用 AI 生成文本
 */
export async function generateText(
  options: AIGenerateOptions
): Promise<AIGenerateResult> {
  const provider = options.provider || getAIProvider();
  const maxTokens = options.maxTokens || 2000;
  const temperature = options.temperature ?? 0.7;

  switch (provider) {
    case 'claude':
      return generateWithClaude(options.messages, maxTokens, temperature, options.model);
    case 'openai':
      return generateWithOpenAI(options.messages, maxTokens, temperature, options.model);
    case 'gemini':
      return generateWithGemini(options.messages, maxTokens, temperature, options.model);
    case 'custom':
      return generateWithCustom(options.messages, maxTokens, temperature, options.model);
    default:
      throw new Error(`不支持的 AI 提供商: ${provider}`);
  }
}

/**
 * 使用 Claude 生成
 */
async function generateWithClaude(
  messages: AIMessage[],
  maxTokens: number,
  temperature: number,
  model?: string
): Promise<AIGenerateResult> {
  const client = getClaudeClient();

  // 分离 system 消息和其他消息
  const systemMessage = messages.find((m) => m.role === 'system');
  const otherMessages = messages.filter((m) => m.role !== 'system');

  const response = await client.messages.create({
    model: model || process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    temperature,
    system: systemMessage?.content,
    messages: otherMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const textContent = response.content.find((c) => c.type === 'text');

  return {
    content: textContent?.text || '',
    provider: 'claude',
    model: response.model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

/**
 * 使用 OpenAI 生成
 */
async function generateWithOpenAI(
  messages: AIMessage[],
  maxTokens: number,
  temperature: number,
  model?: string
): Promise<AIGenerateResult> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: model || process.env.OPENAI_MODEL || 'gpt-4o',
    max_tokens: maxTokens,
    temperature,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const choice = response.choices[0];

  return {
    content: choice.message.content || '',
    provider: 'openai',
    model: response.model,
    usage: response.usage
      ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        }
      : undefined,
  };
}

/**
 * 使用 Google Gemini 生成
 */
async function generateWithGemini(
  messages: AIMessage[],
  maxTokens: number,
  temperature: number,
  model?: string
): Promise<AIGenerateResult> {
  const client = getGeminiClient();
  const modelName = model || process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  const genModel = client.getGenerativeModel({ model: modelName });

  // 转换消息格式
  const systemMessage = messages.find((m) => m.role === 'system');
  const otherMessages = messages.filter((m) => m.role !== 'system');

  // Gemini 使用 history 格式
  const history = otherMessages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMessage = otherMessages[otherMessages.length - 1];

  const chat = genModel.startChat({
    history: history as any,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
    systemInstruction: systemMessage?.content,
  });

  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;

  return {
    content: response.text(),
    provider: 'gemini',
    model: modelName,
    usage: response.usageMetadata
      ? {
          inputTokens: response.usageMetadata.promptTokenCount || 0,
          outputTokens: response.usageMetadata.candidatesTokenCount || 0,
        }
      : undefined,
  };
}

/**
 * 使用自定义 OpenAI 兼容接口生成
 * 支持：通义千问、文心一言、智谱、Kimi、DeepSeek 等
 */
async function generateWithCustom(
  messages: AIMessage[],
  maxTokens: number,
  temperature: number,
  model?: string
): Promise<AIGenerateResult> {
  const client = getCustomClient();
  const modelName = model || process.env.CUSTOM_MODEL || 'default';

  const response = await client.chat.completions.create({
    model: modelName,
    max_tokens: maxTokens,
    temperature,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const choice = response.choices[0];

  return {
    content: choice.message.content || '',
    provider: 'custom',
    model: response.model || modelName,
    usage: response.usage
      ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        }
      : undefined,
  };
}

// ============================================
// 预设的国内 AI 服务配置
// ============================================
export const PRESET_AI_SERVICES = {
  // 阿里通义千问
  qwen: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
  },
  // 智谱 ChatGLM
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4', 'glm-4-flash', 'glm-4-air'],
  },
  // 月之暗面 Kimi
  kimi: {
    baseURL: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  // DeepSeek
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  // 百度文心一言（需要特殊处理，这里仅作参考）
  wenxin: {
    baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
    models: ['ernie-4.0', 'ernie-3.5-turbo'],
  },
};
