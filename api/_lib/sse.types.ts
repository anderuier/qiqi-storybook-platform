/**
 * SSE 事件类型定义
 * 前后端共享的流式响应数据结构
 */

// SSE 内容增量事件
export interface SSEContentEvent {
  type: 'content';
  delta: string;
}

// SSE 完成事件
export interface SSEDoneEvent<T = unknown> {
  type: 'done';
  finish_reason: 'stop';
  data: T;
}

// SSE 错误事件
export interface SSEErrorEvent {
  type: 'error';
  finish_reason: 'error';
  error: { code: string; message: string };
}

// SSE 事件联合类型
export type SSEEvent<T = unknown> = SSEContentEvent | SSEDoneEvent<T> | SSEErrorEvent;

// 故事生成完成数据（与现有 StoryResponse 结构一致）
export interface StoryDoneData {
  storyId: string;
  workId: string;
  title: string;
  content: string;
  wordCount: number;
  estimatedPages: number;
  aiProvider: string;
  aiModel: string;
}

// 分镜生成完成数据（与现有 StoryboardResponse 结构一致）
export interface StoryboardDoneData {
  storyboardId: string;
  pageCount: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    imagePrompt: string;
  }>;
  aiProvider: string;
  aiModel: string;
}
