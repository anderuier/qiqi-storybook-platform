/**
 * Edge 兼容的 SSE 工具模块
 * 使用 ReadableStream + controller.enqueue 替代 res.write
 * SSE 事件格式 data: {JSON}\n\n 保持不变，前端无需改解析逻辑
 */

const encoder = new TextEncoder();

export interface SSEController {
  sendContent: (delta: string) => void;
  sendDone: <T>(data: T) => void;
  sendError: (code: string, message: string) => void;
  response: Response;
}

/**
 * 创建 Edge 兼容的 SSE 控制器
 * 返回 SSEController 对象，包含 sendContent、sendDone、sendError 和 response
 */
export function createSSE(): SSEController {
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  // 向流中写入 SSE 格式数据
  function enqueue(eventJson: string): void {
    controller.enqueue(encoder.encode(`data: ${eventJson}\n\n`));
  }

  function sendContent(delta: string): void {
    enqueue(JSON.stringify({ type: 'content', delta }));
  }

  function sendDone<T>(data: T): void {
    enqueue(JSON.stringify({ type: 'done', finish_reason: 'stop', data }));
    controller.close();
  }

  function sendError(code: string, message: string): void {
    enqueue(JSON.stringify({
      type: 'error',
      finish_reason: 'error',
      error: { code, message },
    }));
    controller.close();
  }

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });

  return { sendContent, sendDone, sendError, response };
}
