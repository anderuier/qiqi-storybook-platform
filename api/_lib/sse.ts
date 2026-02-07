/**
 * SSE 工具函数
 * 封装 Server-Sent Events 响应的通用逻辑
 */

import type { VercelResponse } from '@vercel/node';

/**
 * 初始化 SSE 响应
 * 设置必要的 HTTP 头并发送 200 状态码
 */
export function initSSE(res: VercelResponse): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.status(200);
  // 立即发送响应头到客户端，让 fetch() Promise 尽快 resolve
  // 避免客户端等到第一个 res.write() 才收到响应
  res.flushHeaders();
}

/**
 * 发送内容增量事件
 * 格式: data: {"type":"content","delta":"文本"}\n\n
 */
export function sendContentDelta(res: VercelResponse, delta: string): void {
  const event = JSON.stringify({ type: 'content', delta });
  res.write(`data: ${event}\n\n`);
}

/**
 * 发送完成事件并关闭连接
 * 格式: data: {"type":"done","finish_reason":"stop","data":{...}}\n\n
 */
export function sendDone<T>(res: VercelResponse, data: T): void {
  const event = JSON.stringify({ type: 'done', finish_reason: 'stop', data });
  res.write(`data: ${event}\n\n`);
  res.end();
}

/**
 * 发送错误事件并关闭连接
 * 格式: data: {"type":"error","finish_reason":"error","error":{...}}\n\n
 */
export function sendError(res: VercelResponse, code: string, message: string): void {
  const event = JSON.stringify({
    type: 'error',
    finish_reason: 'error',
    error: { code, message },
  });
  res.write(`data: ${event}\n\n`);
  res.end();
}
