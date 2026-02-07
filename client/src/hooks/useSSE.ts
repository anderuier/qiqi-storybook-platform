/**
 * 流式接收 Hook
 * 封装 fetchSSE 为 React Hook，管理流式状态和增量内容
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSSE } from '../lib/sse-client.js';

export type SSEStatus = 'idle' | 'generating' | 'done' | 'error';

export interface UseSSEReturn<T> {
  content: string;
  status: SSEStatus;
  error: { code: string; message: string } | null;
  doneData: T | null;
  startStream: (path: string, body: unknown) => void;
  stopStream: () => void;
  reset: () => void;
}

export function useSSE<T = unknown>(): UseSSEReturn<T> {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SSEStatus>('idle');
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [doneData, setDoneData] = useState<T | null>(null);

  // 使用 ref 保存 AbortController，避免闭包问题
  const controllerRef = useRef<AbortController | null>(null);
  // 使用 ref 累积内容，避免 React 批量更新导致的闭包问题
  const contentRef = useRef('');

  const stopStream = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setContent('');
    setStatus('idle');
    setError(null);
    setDoneData(null);
    contentRef.current = '';
  }, [stopStream]);

  const startStream = useCallback((path: string, body: unknown) => {
    // 清理之前的流
    stopStream();

    // 重置状态
    setContent('');
    setStatus('generating');
    setError(null);
    setDoneData(null);
    contentRef.current = '';

    const controller = fetchSSE<T>(path, body, {
      onContent: (delta) => {
        contentRef.current += delta;
        setContent(contentRef.current);
      },
      onDone: (data) => {
        setDoneData(data);
        setStatus('done');
        controllerRef.current = null;
      },
      onError: (err) => {
        setError(err);
        setStatus('error');
        controllerRef.current = null;
      },
    });

    controllerRef.current = controller;
  }, [stopStream]);

  // 组件卸载时自动取消流
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return { content, status, error, doneData, startStream, stopStream, reset };
}
