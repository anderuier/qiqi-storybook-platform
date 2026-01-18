/**
 * 创作流程 Hook
 * 管理故事创作的完整流程状态
 */

import { useState, useCallback } from 'react';
import {
  createApi,
  CreateStoryRequest,
  StoryResponse,
  StoryboardResponse,
  StoryboardPage,
  TaskResponse,
  draftsApi,
  DraftDetail,
  ImageProvider,
} from '../lib/api';

// 创作步骤
export type CreateStep = 'input' | 'story' | 'storyboard' | 'images' | 'preview';

// 创作状态
export interface CreateState {
  step: CreateStep;
  isLoading: boolean;
  error: string | null;

  // 当前作品 ID（草稿 ID）
  workId: string | null;

  // 输入数据
  input: CreateStoryRequest['input'] | null;

  // 生成结果
  story: StoryResponse | null;
  storyboard: StoryboardResponse | null;

  // 图片生成任务
  imageTask: {
    taskId: string | null;
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress: number;
    completedPages: number;
    totalPages: number;
  };

  // 页面图片
  pageImages: Record<number, string>;
}

// 初始状态
const initialState: CreateState = {
  step: 'input',
  isLoading: false,
  error: null,
  workId: null,
  input: null,
  story: null,
  storyboard: null,
  imageTask: {
    taskId: null,
    status: 'idle',
    progress: 0,
    completedPages: 0,
    totalPages: 0,
  },
  pageImages: {},
};

export function useCreate() {
  const [state, setState] = useState<CreateState>(initialState);

  // 更新状态
  const updateState = useCallback((updates: Partial<CreateState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // 重置状态
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // 从草稿恢复
  const restoreFromDraft = useCallback(async (draftId: string) => {
    updateState({ isLoading: true, error: null });

    try {
      const draft = await draftsApi.getDraft(draftId);

      // 构建恢复的状态
      const restoredState: Partial<CreateState> = {
        isLoading: false,
        workId: draft.work.id,
        step: draft.work.currentStep as CreateStep,
        input: {
          theme: draft.work.theme,
          childName: draft.work.childName,
          childAge: draft.work.childAge,
          style: draft.work.style,
          length: draft.work.length,
        },
      };

      // 恢复故事
      if (draft.story) {
        restoredState.story = {
          storyId: draft.story.id,
          workId: draft.work.id,
          title: draft.work.title,
          content: draft.story.content,
          wordCount: draft.story.wordCount,
          estimatedPages: Math.ceil(draft.story.wordCount / 100),
        };
      }

      // 恢复分镜
      if (draft.storyboard) {
        restoredState.storyboard = {
          storyboardId: draft.storyboard.id,
          pageCount: draft.storyboard.pages.length,
          pages: draft.storyboard.pages,
        };

        // 恢复已生成的图片
        const pageImages: Record<number, string> = {};
        let completedCount = 0;
        draft.storyboard.pages.forEach((page) => {
          if (page.imageUrl) {
            pageImages[page.pageNumber] = page.imageUrl;
            completedCount++;
          }
        });
        restoredState.pageImages = pageImages;

        // 如果所有图片都已生成，恢复 imageTask 状态为 completed
        const totalPages = draft.storyboard.pages.length;
        if (completedCount === totalPages && totalPages > 0) {
          restoredState.imageTask = {
            taskId: null,
            status: 'completed',
            progress: 100,
            completedPages: completedCount,
            totalPages: totalPages,
          };
        }
      }

      updateState(restoredState);
      return draft;
    } catch (err: any) {
      updateState({
        isLoading: false,
        error: err.message || '恢复草稿失败',
      });
      throw err;
    }
  }, [updateState]);

  // 步骤1：生成故事
  const generateStory = useCallback(
    async (input: CreateStoryRequest['input']) => {
      updateState({
        isLoading: true,
        error: null,
        input,
      });

      try {
        const story = await createApi.generateStory({
          mode: 'free',
          input,
        });

        updateState({
          isLoading: false,
          story,
          workId: story.workId,
          step: 'story',
        });

        return story;
      } catch (err: any) {
        updateState({
          isLoading: false,
          error: err.message || '故事生成失败',
        });
        throw err;
      }
    },
    [updateState]
  );

  // 步骤2：生成分镜剧本
  const generateStoryboard = useCallback(
    async (pageCount?: number) => {
      if (!state.story || !state.workId) {
        throw new Error('请先生成故事');
      }

      updateState({
        isLoading: true,
        error: null,
      });

      try {
        const storyboard = await createApi.generateStoryboard({
          storyContent: state.story.content,
          pageCount,
          workId: state.workId,
        });

        updateState({
          isLoading: false,
          storyboard,
          step: 'storyboard',
        });

        return storyboard;
      } catch (err: any) {
        updateState({
          isLoading: false,
          error: err.message || '分镜剧本生成失败',
        });
        throw err;
      }
    },
    [state.story, state.workId, updateState]
  );

  // 步骤3：生成单张图片
  const generateImage = useCallback(
    async (pageNumber: number, style: string, provider?: ImageProvider) => {
      if (!state.storyboard) {
        throw new Error('请先生成分镜剧本');
      }

      updateState({ isLoading: true, error: null });

      try {
        const result = await createApi.generateImage({
          storyboardId: state.storyboard.storyboardId,
          pageNumber,
          style,
          provider,
        });

        // 更新页面图片
        setState((prev) => ({
          ...prev,
          isLoading: false,
          pageImages: {
            ...prev.pageImages,
            [pageNumber]: result.imageUrl,
          },
        }));

        return result;
      } catch (err: any) {
        updateState({
          isLoading: false,
          error: err.message || '图片生成失败',
        });
        throw err;
      }
    },
    [state.storyboard, updateState]
  );

  // 步骤3：批量生成图片（启动任务）
  const startImageGeneration = useCallback(
    async (style: string, provider?: ImageProvider) => {
      if (!state.storyboard) {
        throw new Error('请先生成分镜剧本');
      }

      updateState({
        error: null,
        imageTask: {
          taskId: null,
          status: 'processing',
          progress: 0,
          completedPages: 0,
          totalPages: state.storyboard.pageCount,
        },
        step: 'images',
      });

      try {
        const result = await createApi.generateImages({
          storyboardId: state.storyboard.storyboardId,
          style,
          provider,
        });

        updateState({
          imageTask: {
            taskId: result.taskId,
            status: 'processing',
            progress: 0,
            completedPages: 0,
            totalPages: result.totalPages,
          },
        });

        return result.taskId;
      } catch (err: any) {
        updateState({
          error: err.message || '图片生成任务创建失败',
          imageTask: {
            ...state.imageTask,
            status: 'failed',
          },
        });
        throw err;
      }
    },
    [state.storyboard, state.imageTask, updateState]
  );

  // 继续生成下一张图片
  const continueImageGeneration = useCallback(async () => {
    if (!state.imageTask.taskId) {
      throw new Error('没有进行中的任务');
    }

    try {
      const result = await createApi.continueTask(state.imageTask.taskId);

      // 更新任务状态
      const isCompleted = result.status === 'completed';

      setState((prev) => ({
        ...prev,
        error: null, // 清除之前的错误
        imageTask: {
          ...prev.imageTask,
          status: isCompleted ? 'completed' : 'processing',
          progress: result.progress || 0,
          completedPages: result.completedItems || prev.imageTask.completedPages,
        },
        pageImages: result.imageUrl
          ? {
              ...prev.pageImages,
              [result.pageNumber!]: result.imageUrl,
            }
          : prev.pageImages,
        step: isCompleted ? 'preview' : prev.step,
      }));

      return result;
    } catch (err: any) {
      // 单次失败不要立即标记为 failed，让轮询继续尝试
      // 设置错误信息，但不改变状态
      const errorMessage = err.message || '图片生成失败，正在重试...';

      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));

      // 抛出错误让轮询逻辑处理
      throw err;
    }
  }, [state.imageTask]);

  // 查询任务状态（增强版：同步已生成的图片）
  const checkTaskStatus = useCallback(async () => {
    if (!state.imageTask.taskId) return null;

    try {
      const result = await createApi.getTask(state.imageTask.taskId);

      // 如果有 workId，从草稿中获取已生成的图片
      if (state.workId) {
        try {
          const draft = await draftsApi.getDraft(state.workId);

          // 同步已生成的图片
          if (draft.storyboard) {
            const pageImages: Record<number, string> = {};
            let completedCount = 0;

            draft.storyboard.pages.forEach((page) => {
              if (page.imageUrl) {
                pageImages[page.pageNumber] = page.imageUrl;
                completedCount++;
              }
            });

            // 更新状态，包括图片
            setState((prev) => ({
              ...prev,
              imageTask: {
                ...prev.imageTask,
                status: result.status as any,
                progress: result.progress,
                completedPages: completedCount, // 使用实际已生成的数量
                totalPages: draft.storyboard.pages.length,
              },
              pageImages: pageImages, // 同步所有已生成的图片
            }));

            return result;
          }
        } catch (draftErr) {
          console.error('获取草稿失败:', draftErr);
          // 如果获取草稿失败，仍然更新任务状态
        }
      }

      // 如果没有 workId 或获取草稿失败，只更新任务状态
      updateState({
        imageTask: {
          ...state.imageTask,
          status: result.status as any,
          progress: result.progress,
          completedPages: result.completedItems,
        },
      });

      return result;
    } catch (err) {
      console.error('查询任务状态失败:', err);
      return null;
    }
  }, [state.imageTask, state.workId, updateState]);

  // 跳转到指定步骤
  const goToStep = useCallback(
    (step: CreateStep) => {
      updateState({ step });
    },
    [updateState]
  );

  return {
    ...state,
    generateStory,
    generateStoryboard,
    generateImage,
    startImageGeneration,
    continueImageGeneration,
    checkTaskStatus,
    goToStep,
    clearError,
    reset,
    restoreFromDraft,
  };
}
