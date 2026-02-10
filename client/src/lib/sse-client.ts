/**
 * SSE 客户端
 * 使用 fetch + ReadableStream 解析 Server-Sent Events
 * 支持 POST 请求和 Authorization header（EventSource 仅支持 GET）
 */

import { API_BASE_URL, getToken, clearToken } from './api.js';

// SSE 请求超时时间（毫秒）- 5 分钟
const SSE_TIMEOUT = 5 * 60 * 1000;

// SSE 事件回调
export interface SSECallbacks<T = unknown> {
  onContent: (delta: string) => void;
  onDone: (data: T) => void;
  onError: (error: { code: string; message: string }) => void;
}

/**
 * 发起 SSE 流式请求
 * @returns AbortController 用于取消请求
 */
export function fetchSSE<T = unknown>(
  path: string,
  body: unknown,
  callbacks: SSECallbacks<T>,
): AbortController {
  const controller = new AbortController();

  // 设置超时取消
  const timeoutId = setTimeout(() => {
    controller.abort();
    callbacks.onError({
      code: 'TIMEOUT',
      message: '请求超时，请稍后重试',
    });
  }, SSE_TIMEOUT);

  // 清除超时定时器的辅助函数
  const clearTimeoutFn = () => {
    clearTimeout(timeoutId);
  };

  const url = `${API_BASE_URL}${path}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (response) => {
      // 非 200 响应：尝试解析 JSON 错误
      if (!response.ok) {
        clearTimeoutFn(); // 清除超时定时器
        // 401 未授权：清除 token 并跳转登录
        if (response.status === 401) {
          clearToken();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }

        try {
          const errorData = await response.json();
          callbacks.onError({
            code: errorData?.error?.code || 'HTTP_ERROR',
            message: errorData?.error?.message || `请求失败 (${response.status})`,
          });
        } catch {
          callbacks.onError({
            code: 'HTTP_ERROR',
            message: `请求失败 (${response.status})`,
          });
        }
        return;
      }

      // 读取 SSE 流
      const reader = response.body?.getReader();
      if (!reader) {
        clearTimeoutFn(); // 清除超时定时器
        callbacks.onError({ code: 'STREAM_ERROR', message: '无法读取响应流' });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let receivedTerminalEvent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 按 SSE 协议解析：以 \n\n 分隔事件
        const parts = buffer.split('\n\n');
        // 最后一部分可能不完整，保留在 buffer 中
        buffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6); // 去掉 "data: " 前缀
          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'content') {
              callbacks.onContent(event.delta);
            } else if (event.type === 'done') {
              receivedTerminalEvent = true;
              clearTimeoutFn(); // 清除超时定时器
              callbacks.onDone(event.data as T);
            } else if (event.type === 'error') {
              receivedTerminalEvent = true;
              clearTimeoutFn(); // 清除超时定时器
              callbacks.onError(event.error);
            }
          } catch {
            // JSON 解析失败，忽略该事件
            console.warn('[SSE] 无法解析事件:', jsonStr);
          }
        }
      }

      // 流断开检测：reader done 但未收到 done/error 事件，说明连接异常断开
      if (!receivedTerminalEvent) {
        clearTimeoutFn(); // 清除超时定时器
        callbacks.onError({
          code: 'STREAM_DISCONNECTED',
          message: '服务器连接异常断开，请重试',
        });
      }
    })
    .catch((err) => {
      clearTimeoutFn(); // 清除超时定时器
      // 请求被取消时不触发错误回调
      if (err.name === 'AbortError') return;

      callbacks.onError({
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络',
      });
    });

  return controller;
}
